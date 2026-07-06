import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { buildEmailInsights } from '../services/emailInsights.js';
import User from '../models/User.js';
import gmailService from '../services/gmailService.js';

const router = express.Router();

router.get('/insights', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const stats = await gmailService.getAllStats(user);
    const insights = buildEmailInsights(stats);

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error('Error fetching email insights:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email insights', error: error.message });
  }
});

export default router;
