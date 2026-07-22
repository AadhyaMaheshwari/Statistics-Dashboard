import {
    createCampaignService,
    getCampaignsService,
    deleteCampaignService,
} from "../services/campaignService.js";

import { parseCSV } from "../services/csvParserService.js";
import { sendCampaignEmail } from "../services/gmailCampaignService.js";
import { sendCampaignService } from "../services/emailSenderService.js";
import crypto from "crypto";
import Recipient from "../models/Recipient.js";
import Campaign from "../models/Campaign.js";
import { getCampaignAnalyticsService } from "../services/campaignAnalyticsService.js";

// Finds a value by key regardless of casing (e.g. "Email", "email", "EMAIL",
// "recipientEmail" all resolve correctly, since CSV files vary in header style).
function getField(row, ...possibleNames) {
    const lowerMap = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
    );
    for (const name of possibleNames) {
        const value = lowerMap[name.toLowerCase()];
        if (value) return value;
    }
    return undefined;
}

export const createCampaign = async (req, res) => {
    try {
        const { name, subject, body } = req.body;

        if (!name || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: "Name, subject and body are required.",
            });
        }

        const userId = req.user._id;

        const campaign = await createCampaignService({
            userId,
            name,
            subject,
            body,
        });

        return res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            campaign,
        });
    } catch (error) {
        console.error("Create Campaign Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getCampaigns = async (req, res) => {
    try {
        const userId = req.user._id;

        const campaigns = await getCampaignsService(userId);

        return res.status(200).json({
            success: true,
            campaigns,
        });
    } catch (error) {
        console.error("Get Campaigns Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const userId = req.user._id;
        const campaignId = req.params.id;

        await deleteCampaignService(userId, campaignId);

        return res.status(200).json({
            success: true,
            message: "Campaign deleted successfully.",
        });
    } catch (error) {
        console.error("Delete Campaign Error:", error);

        if (error.message === "Invalid campaign id.") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        if (error.message === "Campaign not found.") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const uploadRecipients = async (req, res) => {
    try {
        console.log("Upload Debug");
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        console.log("File:", req.file);
        console.log("============");

        const campaignId = req.params.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a CSV file.",
            });
        }

        const recipients = await parseCSV(req.file.path);

        const validRecipients = recipients
            .map((recipient) => ({
                campaignId,
                email: (getField(recipient, 'email', 'recipientemail') || '').trim().toLowerCase(),
                name: (getField(recipient, 'name', 'recipientname') || '').trim(),
                trackingToken: crypto.randomUUID(),
                status: "pending",
            }))
            .filter((recipient) => recipient.email); // drop rows with no usable email instead of failing the whole batch

        if (!validRecipients.length) {
            return res.status(400).json({
                success: false,
                message: "No valid email addresses found in the uploaded CSV.",
            });
        }

        const savedRecipients = await Recipient.insertMany(validRecipients);

        await Campaign.findByIdAndUpdate(campaignId, {
            totalRecipients: savedRecipients.length,
        });

        return res.status(200).json({
            success: true,
            message: "Recipients uploaded successfully.",
            campaignId,
            totalRecipients: savedRecipients.length,
        });
    } catch (error) {
        console.error("Upload Recipients Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const sendCampaign = async (req, res) => {
    try {
        const result = await sendCampaignService(
            req.params.id,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Campaign completed successfully.",
            ...result,
        });
    } catch (error) {
        console.error("Send Campaign Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const testSendEmail = async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const campaign = {
            subject: "Test Campaign",
            body: `
                <h2>Hello, This is from Statistics Dashboard</h2>
                <p>This is the first of the few emails sent using the Gmail Campaign Service.</p>
                <p>Regards,<br/>Aadhya</p>
            `,
        };

        const recipient = {
            email: req.body.email,
            name: "Test User",
        };

        console.log("TEST EMAIL RECIPIENT:", recipient);

        const result = await sendCampaignEmail({
            user: req.user,
            recipient,
            campaign,
        });

        return res.status(200).json({
            success: true,
            message: "Email sent successfully.",
            result,
        });
    } catch (error) {
        console.error("Test Send Email Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getCampaignAnalytics = async (req, res) => {

    try {

        const analytics = await getCampaignAnalyticsService(
            req.params.id,
            req.user
        );

        return res.status(200).json({
            success: true,
            ...analytics,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};