import Campaign from "../models/Campaign.js";
import Recipient from "../models/Recipient.js";
import { syncCampaignBounceRecipients, syncCampaignReplyRecipients } from "./gmailBounceService.js";

export const getCampaignAnalyticsService = async (campaignId, user) => {

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error("Campaign not found.");
    }

    let syncWarning = null;

    if (!user?.gmailConnected) {
        syncWarning = "Gmail is not connected — reply/bounce stats won't update.";
    } else {
        try {
            await syncCampaignBounceRecipients(user, campaignId);
            await syncCampaignReplyRecipients(user, campaignId);
        } catch (error) {
            console.error("Analytics sync warning:", error.message);
            syncWarning = "Gmail sync failed — stats may be stale. Try reconnecting Gmail.";
        }
    }

    const recipients = await Recipient.find({
        campaignId,
    });

    const totalRecipients = recipients.length;
    const sent = recipients.filter(r => r.status === "sent").length;
    const bounced = recipients.filter(r => r.status === "bounced").length;
    const opened = recipients.filter(r => r.opened).length;
    const clicked = recipients.filter(r => r.clicked).length;
    const replied = recipients.filter(r => r.replied).length;

    return {
        campaign: {
            _id: campaign._id,
            name: campaign.name,
            subject: campaign.subject,
            status: campaign.status,
            createdAt: campaign.createdAt,
        },

        stats: {
            totalRecipients,
            sent,
            bounced,
            opened,
            clicked,
            replied,
        },

        rates: {
            deliveryRate:
                totalRecipients === 0
                    ? 0
                    : ((Math.max(0, sent - bounced) / totalRecipients) * 100).toFixed(2),

            openRate:
                sent === 0
                    ? 0
                    : ((opened / sent) * 100).toFixed(2),

            clickRate:
                sent === 0
                    ? 0
                    : ((clicked / sent) * 100).toFixed(2),

            replyRate:
                sent === 0
                    ? 0
                    : ((replied / sent) * 100).toFixed(2),

            bounceRate:
                totalRecipients === 0
                    ? 0
                    : ((bounced / totalRecipients) * 100).toFixed(2),
        },

        recipients,
        syncWarning,
    };
};