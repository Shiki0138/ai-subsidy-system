import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import devAuthRoutes from './routes/devAuth';
import sustainabilitySubsidyRoutes from './routes/sustainabilitySubsidy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7001;
const prisma = new PrismaClient();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:7002', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ai-subsidy-backend',
    timestamp: new Date().toISOString()
  });
});

// Dev auth routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev-auth', devAuthRoutes);
  console.log('🔧 Development auth endpoints enabled');
}

// Sustainability subsidy routes
app.use('/api/sustainability-subsidy', sustainabilitySubsidyRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 AI補助金申請システム バックエンドサーバー起動`);
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
  
  // Database connection test
  prisma.$queryRaw`SELECT 1`
    .then(() => console.log('✅ データベース接続成功'))
    .catch((err) => console.error('❌ データベース接続失敗:', err));
});

export { app, prisma };