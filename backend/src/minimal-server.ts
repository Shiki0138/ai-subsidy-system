import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import devAuthRoutes from './routes/devAuth';
// import sustainabilitySubsidyRoutes from './routes/sustainabilitySubsidy';

const app = express();
const PORT = 7001;
const prisma = new PrismaClient();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:7002', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ai-subsidy-backend-minimal',
    timestamp: new Date().toISOString()
  });
});

// Dev auth routes (only in development)
app.use('/api/dev-auth', devAuthRoutes);

// // Sustainability subsidy routes
// app.use('/api/sustainability-subsidy', sustainabilitySubsidyRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});

export { app, prisma };