import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticationError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// � �n֗
router.get('/', conditionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('�<LŁgY');
  }

  // TODO: �����\Wf��
  // �(o�ï�����Y
  const notifications = [
    {
      id: '1',
      type: 'info',
      title: '���������nJ�[',
      message: '�HM2BK�4B~g����󹒟�W~Y',
      read: false,
      createdAt: new Date(Date.now() - 3600000) // 1B�M
    },
    {
      id: '2',
      type: 'success',
      title: '3��L�XU�~W_',
      message: '�neO�ܩ�n3��L���XU�~W_',
      read: true,
      createdAt: new Date(Date.now() - 7200000) // 2B�M
    }
  ];

  res.json({
    success: true,
    data: notifications,
    unreadCount: notifications.filter(n => !n.read).length
  });
}));

// ��kY�
router.put('/:id/read', conditionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AuthenticationError('�<LŁgY');
  }

  // TODO: ��n����
  res.json({
    success: true,
    message: '��kW~W_'
  });
}));

// Yyfn��kY�
router.put('/read-all', conditionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AuthenticationError('�<LŁgY');
  }

  // TODO: ��n ����
  res.json({
    success: true,
    message: 'Yyfn��kW~W_'
  });
}));

// �Jd
router.delete('/:id', conditionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AuthenticationError('�<LŁgY');
  }

  // TODO: ��nJd�
  res.json({
    success: true,
    message: '�JdW~W_'
  });
}));

export default router;