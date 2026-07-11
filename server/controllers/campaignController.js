import {
    createCampaignService,
    getCampaignsService,
} from "../services/campaignService.js";

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