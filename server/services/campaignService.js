import Campaign from "../models/Campaign.js";

export const createCampaignService = async ({
    userId,
    name,
    subject,
    body,
}) => {
    const campaign = await Campaign.create({
        userId,
        name,
        subject,
        body,
    });

    return campaign;
};

export const getCampaignsService = async (userId) => {
    const campaigns = await Campaign.find({ userId }).sort({
        createdAt: -1,
    });

    return campaigns;
};