import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// ���������
const createDocumentSchema = z.object({
  subsidyProgramId: z.string().min(1),
  type: z.enum(['OVERVIEW', 'GUIDELINE', 'APPLICATION_FORM', 'CHECKLIST', 'FAQ', 'PRESENTATION', 'EXAMPLE', 'OTHER']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  version: z.string().min(1),
  publishedDate: z.string().datetime(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  changeLog: z.string().optional()
});

// ܩ������ThnǙ �֗
router.get('/subsidy-programs/:subsidyProgramId/documents', asyncHandler(async (req: Request, res: Response) => {
  const { subsidyProgramId } = req.params;
  const { type, isLatest } = req.query;

  const where: any = { subsidyProgramId };
  
  if (type) {
    where.type = type;
  }
  
  if (isLatest !== undefined) {
    where.isLatest = isLatest === 'true';
  }

  const documents = await prisma.subsidyDocument.findMany({
    where,
    orderBy: [
      { type: 'asc' },
      { publishedDate: 'desc' }
    ],
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: documents.map(doc => ({
      ...doc,
      publishedDateFormatted: new Date(doc.publishedDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      lastCheckedFormatted: new Date(doc.lastChecked).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  });
}));

// y�nǙs0֗
router.get('/documents/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await prisma.subsidyDocument.findUnique({
    where: { id },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
          organizationName: true,
          applicationStart: true,
          applicationEnd: true
        }
      }
    }
  });

  if (!document) {
    throw new NotFoundError('ǙL�dK�~[�');
  }

  res.json({
    success: true,
    data: {
      ...document,
      publishedDateFormatted: new Date(document.publishedDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      lastCheckedFormatted: new Date(document.lastChecked).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  });
}));

// ܩ������ns0�1֗Ǚ�M	
router.get('/subsidy-programs/:id/detail', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const program = await prisma.subsidyProgram.findUnique({
    where: { id },
    include: {
      documents: {
        where: { isLatest: true },
        orderBy: { type: 'asc' }
      },
      guidelines: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!program) {
    throw new NotFoundError('ܩ������L�dK�~[�');
  }

  // Ǚ����%kt
  const documentsByType = program.documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, typeof program.documents>);

  res.json({
    success: true,
    data: {
      program: {
        ...program,
        applicationPeriod: {
          start: program.applicationStart,
          end: program.applicationEnd,
          startFormatted: new Date(program.applicationStart).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          endFormatted: new Date(program.applicationEnd).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          daysRemaining: Math.max(0, Math.ceil((new Date(program.applicationEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        },
        lastUpdatedFormatted: new Date(program.lastUpdated).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      documentsByType,
      summary: {
        totalDocuments: program.documents.length,
        hasOverview: documentsByType.OVERVIEW?.length > 0,
        hasGuideline: documentsByType.GUIDELINE?.length > 0,
        hasApplicationForm: documentsByType.APPLICATION_FORM?.length > 0,
        lastDocumentUpdate: program.documents.length > 0 
          ? Math.max(...program.documents.map(d => d.publishedDate.getTime()))
          : null
      }
    }
  });
}));

// Ǚn��\�n	
router.post('/documents', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  // TODO: �)P��ï
  
  const validatedData = createDocumentSchema.parse(req.body);

  // �Xn �H�^ �kY�
  if (validatedData.type !== 'OTHER') {
    await prisma.subsidyDocument.updateMany({
      where: {
        subsidyProgramId: validatedData.subsidyProgramId,
        type: validatedData.type,
        isLatest: true
      },
      data: {
        isLatest: false
      }
    });
  }

  const document = await prisma.subsidyDocument.create({
    data: {
      ...validatedData,
      publishedDate: new Date(validatedData.publishedDate),
      validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined
    }
  });

  res.status(201).json({
    success: true,
    data: document
  });
}));

// Ǚn���n	
router.put('/documents/:id', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  // TODO: �)P��ï

  const document = await prisma.subsidyDocument.findUnique({
    where: { id }
  });

  if (!document) {
    throw new NotFoundError('ǙL�dK�~[�');
  }

  const updatedDocument = await prisma.subsidyDocument.update({
    where: { id },
    data: {
      ...req.body,
      lastChecked: new Date()
    }
  });

  res.json({
    success: true,
    data: updatedDocument
  });
}));

//  ��1n �֗
router.get('/latest-updates', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  const latestDocuments = await prisma.subsidyDocument.findMany({
    where: { isLatest: true },
    orderBy: { publishedDate: 'desc' },
    take: Number(limit),
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: latestDocuments.map(doc => ({
      id: doc.id,
      subsidyProgramId: doc.subsidyProgramId,
      subsidyProgramName: doc.subsidyProgram.name,
      category: doc.subsidyProgram.category,
      type: doc.type,
      title: doc.title,
      publishedDate: doc.publishedDate,
      publishedDateFormatted: new Date(doc.publishedDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      isNew: (Date.now() - doc.publishedDate.getTime()) < 7 * 24 * 60 * 60 * 1000 // 7��
    }))
  });
}));

export default router;