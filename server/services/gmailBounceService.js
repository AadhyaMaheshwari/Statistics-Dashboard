import Recipient from "../models/Recipient.js";
import Campaign from "../models/Campaign.js";
import { getGmailClient } from "./gmailService.js";

function decodeBodyData(body) {
    if (!body || !body.data) return "";
    return Buffer.from(body.data, "base64").toString("utf-8");
}

function getTextFromPayload(payload) {
    if (!payload) return "";

    if (payload.mimeType === "text/plain" || payload.mimeType === "text/html") {
        return decodeBodyData(payload.body);
    }

    if (Array.isArray(payload.parts)) {
        return payload.parts.map(getTextFromPayload).join("\n");
    }

    return "";
}

function extractEmails(rawText) {
    const emails = new Set();
    const regex = /(?:Final-Recipient|Original-Recipient|To|Recipient|Delivered-To):\s*(?:rfc822;\s*)?([\w.+\-]+@[\w.-]+\.[A-Za-z]{2,})/gi;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
        emails.add(match[1].toLowerCase());
    }

    return Array.from(emails);
}

function extractBounceReason(rawText) {
    const normalized = rawText.replace(/\s+/g, " ").trim();

    const patterns = [
        /Diagnostic-Code:\s*([^\n]+)/i,
        /Status:\s*([^\n]+)/i,
        /Reason:\s*([^\n]+)/i,
        /SMTP error from remote mail server after RCPT TO:<[^>]+>:\s*([^\n]+)/i,
        /((?:mailbox unavailable|user unknown|quota exceeded|domain not found|recipient address rejected|mail loop detected|delivery failed|undelivered|mail delivery failed))/i,
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match) {
            return match[1]?.trim() || match[0].trim();
        }
    }

    return "Bounce notification received";
}

function collectMessageIdentifiers(headers) {
    const candidates = new Set();
    const headerMap = new Map();

    (headers || []).forEach((header) => {
        if (!header?.name || !header?.value) return;
        const key = header.name.toLowerCase();
        headerMap.set(key, header.value);
        candidates.add(header.value.trim());
    });

    ["message-id", "in-reply-to", "references", "thread-id", "x-gm-message-id"].forEach((key) => {
        if (headerMap.has(key)) {
            const values = headerMap.get(key).split(/\s+/).filter(Boolean);
            values.forEach((value) => candidates.add(value));
        }
    });

    return Array.from(candidates);
}

function extractReplyMetadata(headers) {
    const values = {};
    const headerMap = new Map();

    (headers || []).forEach((header) => {
        if (!header?.name || !header?.value) return;
        const key = header.name.toLowerCase();
        headerMap.set(key, header.value);
    });

    values.from = headerMap.get("from") || "";
    values.inReplyTo = headerMap.get("in-reply-to") || "";
    values.references = headerMap.get("references") || "";
    values.messageId = headerMap.get("message-id") || "";

    return values;
}

async function listAllMessages(gmail, query, hardCap = 500) {
    let messages = [];
    let pageToken = null;

    do {
        const response = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 100,
            ...(pageToken && { pageToken }),
        });

        messages = messages.concat(response.data.messages || []);
        pageToken = response.data.nextPageToken || null;
    } while (pageToken && messages.length < hardCap);

    return messages.slice(0, hardCap);
}

async function getCampaignDateQuery(campaignId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign?.createdAt) return "";

    const afterSeconds = Math.floor(new Date(campaign.createdAt).getTime() / 1000);
    return ` after:${afterSeconds}`;
}

export const syncCampaignBounceRecipients = async (user, campaignId) => {
    if (!user?.googleAccessToken) {
        return [];
    }

    const gmail = getGmailClient(user);
    const dateQuery = await getCampaignDateQuery(campaignId); // NEW
    const query =
        'in:inbox (from:(mailer-daemon OR postmaster OR "Mail Delivery Subsystem" OR "Mail Delivery System") OR subject:("Mail delivery failed" OR "Delivery Status Notification" OR "Undelivered" OR "Delivery Status Notification (Failure)"))' +
        dateQuery; 

    const messages = await listAllMessages(gmail, query); 
    if (!messages.length) {
        return [];
    }

    const recipients = await Recipient.find({ campaignId });
    const updatedRecipients = [];

    for (const message of messages) {
        const messageDetails = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
        });

        const payload = messageDetails.data.payload || {};
        const headers = payload.headers || [];
        const identifiers = collectMessageIdentifiers(headers);
        const rawText = `${messageDetails.data.snippet || ""}\n${getTextFromPayload(payload)}`;
        const matchedEmails = extractEmails(rawText);

        for (const recipient of recipients) {
            if (recipient.status === "bounced") {
                continue;
            }

            const emailMatches = recipient.email && matchedEmails.includes(recipient.email.toLowerCase());
            const messageIdMatches = Boolean(recipient.messageId && identifiers.some((value) => value.includes(recipient.messageId)));
            const threadIdMatches = Boolean(recipient.threadId && identifiers.some((value) => value.includes(recipient.threadId)));
            const contentMatches = Boolean(recipient.email && rawText.toLowerCase().includes(recipient.email.toLowerCase()));

            if (!emailMatches && !messageIdMatches && !threadIdMatches && !contentMatches) {
                continue;
            }

            const reason = extractBounceReason(rawText);
            const updatedRecipient = await Recipient.findByIdAndUpdate(
                recipient._id,
                {
                    $set: {
                        status: "bounced",
                        bounceReason: reason,
                        errorMessage: reason,
                    },
                },
                { new: true }
            );

            if (updatedRecipient) {
                updatedRecipients.push(updatedRecipient);
            }
        }
    }

    return updatedRecipients;
};

export const syncCampaignReplyRecipients = async (user, campaignId) => {
    if (!user?.googleAccessToken) {
        return [];
    }

    const gmail = getGmailClient(user);
    const dateQuery = await getCampaignDateQuery(campaignId); 

    const query =
        'in:inbox -from:(mailer-daemon OR postmaster OR "Mail Delivery Subsystem" OR "Mail Delivery System")' +
        dateQuery;

    const messages = await listAllMessages(gmail, query); // CHANGED: was a single messages.list call capped at 100

    if (!messages.length) {
        return [];
    }

    const recipients = await Recipient.find({ campaignId });
    const updatedRecipients = [];

    for (const message of messages) {
        const messageDetails = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
        });

        const payload = messageDetails.data.payload || {};
        const headers = payload.headers || [];
        const metadata = extractReplyMetadata(headers);
        const rawText = `${messageDetails.data.snippet || ""}\n${getTextFromPayload(payload)}`;

        for (const recipient of recipients) {
            if (recipient.replied || !recipient.email) {
                continue;
            }

            // CHANGED: a reply must actually come FROM the recipient, or be
            // properly threaded to the message we sent them (In-Reply-To /
            // References matching their Message-Id or Thread-Id). We no
            // longer accept a loose "recipient's email appears somewhere in
            // this message's text" match — that matched bounce notifications,
            // forwarded threads, and any other email that merely mentioned
            // the address, without it actually being a reply.
            const senderMatchesRecipient = metadata.from.toLowerCase().includes(recipient.email.toLowerCase());
            const threadMatches = Boolean(recipient.threadId && metadata.inReplyTo.includes(recipient.threadId));
            const messageMatches = Boolean(recipient.messageId && (metadata.inReplyTo.includes(recipient.messageId) || metadata.references.includes(recipient.messageId)));

            if (!senderMatchesRecipient && !threadMatches && !messageMatches) {
                continue;
            }

            const updatedRecipient = await Recipient.findByIdAndUpdate(
                recipient._id,
                {
                    $set: {
                        replied: true,
                        repliedAt: new Date(),
                    },
                },
                { new: true }
            );

            if (updatedRecipient) {
                updatedRecipients.push(updatedRecipient);
            }
        }
    }

    return updatedRecipients;
};

export default {
    syncCampaignBounceRecipients,
    syncCampaignReplyRecipients,
};