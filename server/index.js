import dotenv from 'dotenv';
dotenv.config();
import gmailRouter from './routes/gmail.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import labelRoutes from './config/labelRoutes.js';
import authRouter from './routes/auth.js';
import googleAuthRouter from './routes/googleAuth.js';
import gmailConnectRoutes from './routes/gmailConnect.js';
import gmailStatsRoutes from './routes/gmailStats.js';
import gmailRecentRoutes from "./routes/gmailRecent.js";
import campaignRoutes from "./routes/campaign.js";
import trackingRoutes from "./routes/tracking.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/signup-app';

// Connect to MongoDB
let dbConnected = false;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    dbConnected = true;
  })
  
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.error('MONGO_URI:', MONGO_URI);
    // Don't exit - allow server to run even if DB is not connected
    // process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend API server is running. Visit http://localhost:3000 for the frontend.' });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Auth routes
app.use('/api/auth', authRouter);
app.use('/api/auth', googleAuthRouter);
app.use('/api/auth', gmailConnectRoutes);
app.use('/api/gmail', gmailStatsRoutes);
app.use('/api/labels', labelRoutes);
app.use("/api/gmail/recent", gmailRecentRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/tracking", trackingRoutes);
app.get('/api/dashboard', (req, res) => {
  // Add dashboard logic here
  res.json({ message: 'Dashboard data' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: err.message 
  });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});