import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import yelpRoutes from './routes/yelpRoutes.js';
import { redis } from './utils/redisClient.js';

// Load environment variables
dotenv.config();
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✔ Connected to MongoDB'))
  .catch(err => console.error('✖ MongoDB connection error:', err));
// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/yelp', yelpRoutes);

app.get('/:groupId/recommend', async (req, res) => {
  const recsJson = await redis.hget('group_recs', req.params.groupId);
  const recs = recsJson ? JSON.parse(recsJson) : [];
  res.json({ recommendations: recs });
});
// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'GrubSync API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function addPreferencesToRedis(groupId, cuisines, dietary) {
  await redis.xadd('preferences', '*',
    'groupId', groupId,
    'cuisines', JSON.stringify(cuisines),
    'dietary', JSON.stringify(dietary),
  );
}
