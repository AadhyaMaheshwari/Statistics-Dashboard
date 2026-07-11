import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    createCampaign,
    getCampaigns,
} from "../controllers/campaignController.js";

const router = express.Router();

// Get all campaigns for the logged-in user
router.get("/", protect, getCampaigns);

// Create a new campaign
router.post("/", protect, createCampaign);

export default router;