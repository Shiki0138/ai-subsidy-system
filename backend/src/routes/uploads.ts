/**
 * Enhanced File Upload API Routes
 * Integration with fileUploadService.js for comprehensive file management
 */

import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadRateLimit, generalRateLimit } from '../config/security.js';
import { uploadFiles, deleteFile, getFileInfo, getUserFiles, getUploadStats } from '../services/fileUploadService.js';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const router = express.Router();
const prisma = new PrismaClient();

// Logger for uploads route
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/uploads-api.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * POST /api/uploads
 * Upload multiple files with enhanced processing
 */
router.post('/', 
  authenticateToken,
  uploadRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'AUTH_REQUIRED'
        });
      }

      // Check user's current file count
      const userFileCount = await prisma.uploadedFile.count({
        where: { 
          userId,
          status: 'active'
        }
      });

      if (userFileCount >= 50) { // MAX_FILES_PER_USER
        return res.status(429).json({
          success: false,
          error: 'Maximum file limit reached (50 files per user)',
          errorCode: 'FILE_LIMIT_EXCEEDED',
          metadata: {
            currentFileCount: userFileCount,
            maxAllowed: 50
          }
        });
      }

      // Use multer config and process files manually for better database integration
      const { multerConfig } = require('../services/fileUploadService.js');
      
      const upload = multerConfig.array('files');
      
      upload(req, res, async (err: any) => {
        if (err) {
          let errorMessage = 'ファイルアップロードエラー';
          let statusCode = 400;
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            errorMessage = 'ファイルサイズが制限を超えています (最大10MB)';
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            errorMessage = 'アップロードファイル数が制限を超えています (最大10ファイル)';
          } else {
            errorMessage = err.message;
          }
          
          return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            errorCode: err.code || 'UPLOAD_ERROR'
          });
        }
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'アップロードするファイルを選択してください',
            errorCode: 'NO_FILES'
          });
        }
        
        const processedFiles = [];
        const errors = [];
        
        // Process each uploaded file
        for (const file of req.files as Express.Multer.File[]) {
          try {
            // Import and use the processUploadedFile function
            const { processUploadedFile } = require('../services/fileUploadService.js');
            const fileRecord = await processUploadedFile(file, userId);
            
            // Save to database
            const dbRecord = await prisma.uploadedFile.create({
              data: {
                id: fileRecord.id,
                userId,
                originalName: fileRecord.originalName,
                sanitizedName: fileRecord.sanitizedName,
                size: fileRecord.size,
                mimeType: fileRecord.mimeType,
                hash: fileRecord.hash,
                storagePath: fileRecord.storagePath,
                url: fileRecord.url,
                backend: fileRecord.backend,
                metadata: fileRecord.metadata,
                scanResult: fileRecord.scanResult,
                status: 'ACTIVE'
              }
            });
            
            processedFiles.push(dbRecord);
            
            logger.info('File upload and database save completed', {
              fileId: fileRecord.id,
              userId,
              originalName: fileRecord.originalName,
              size: fileRecord.size
            });
            
          } catch (fileError: any) {
            logger.error('File processing error', {
              fileName: file.originalname,
              userId,
              error: fileError.message
            });
            
            errors.push({
              filename: file.originalname,
              error: fileError.message
            });
          }
        }
        
        // Return response
        const response = {
          success: processedFiles.length > 0,
          uploadedFiles: processedFiles,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            totalFiles: req.files.length,
            successful: processedFiles.length,
            failed: errors.length,
            userFileCount: userFileCount + processedFiles.length
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        };
        
        if (processedFiles.length === 0) {
          res.status(400).json(response);
        } else {
          res.status(200).json(response);
        }
      });

    } catch (error: any) {
      logger.error('Upload API error', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error during file upload',
        errorCode: 'UPLOAD_FAILED',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/uploads
 * Get user's uploaded files with pagination and filtering
 */
router.get('/',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const fileType = req.query.type as string;
      const status = req.query.status as string || 'active';
      const search = req.query.search as string;

      // Build filter conditions
      const where: any = {
        userId,
        status
      };

      if (fileType) {
        where.mimeType = {
          contains: fileType
        };
      }

      if (search) {
        where.OR = [
          { originalName: { contains: search, mode: 'insensitive' } },
          { sanitizedName: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [files, totalCount] = await Promise.all([
        prisma.uploadedFile.findMany({
          where,
          orderBy: { uploadedAt: 'desc' },
          skip: offset,
          take: limit,
          select: {
            id: true,
            originalName: true,
            sanitizedName: true,
            size: true,
            mimeType: true,
            url: true,
            uploadedAt: true,
            status: true,
            metadata: true
          }
        }),
        prisma.uploadedFile.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            fileType,
            status,
            search
          }
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Get files API error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve files'
      });
    }
  }
);

/**
 * GET /api/uploads/:fileId
 * Get specific file information
 */
router.get('/:fileId',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const fileId = req.params.fileId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const file = await prisma.uploadedFile.findFirst({
        where: {
          id: fileId,
          userId, // Ensure user owns the file
          status: 'active'
        }
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
          errorCode: 'FILE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: file,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Get file info API error', {
        userId: req.user?.id,
        fileId: req.params.fileId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve file information'
      });
    }
  }
);

/**
 * DELETE /api/uploads/:fileId
 * Delete a specific file
 */
router.delete('/:fileId',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const fileId = req.params.fileId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if file exists and user owns it
      const file = await prisma.uploadedFile.findFirst({
        where: {
          id: fileId,
          userId,
          status: 'active'
        }
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found or access denied',
          errorCode: 'FILE_NOT_FOUND'
        });
      }

      // Mark as deleted in database
      await prisma.uploadedFile.update({
        where: { id: fileId },
        data: { 
          status: 'deleted',
          deletedAt: new Date()
        }
      });

      // Delete from storage backend
      try {
        await deleteFile(fileId, userId);
      } catch (storageError: any) {
        logger.warn('Failed to delete from storage backend, but database record updated', {
          fileId,
          userId,
          error: storageError.message
        });
      }

      logger.info('File deleted successfully', {
        fileId,
        userId,
        originalName: file.originalName
      });

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: {
          fileId,
          originalName: file.originalName
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Delete file API error', {
        userId: req.user?.id,
        fileId: req.params.fileId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  }
);

/**
 * GET /api/uploads/stats/summary
 * Get upload statistics for the current user
 */
router.get('/stats/summary',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const [
        totalFiles,
        totalSize,
        filesByType,
        recentUploads
      ] = await Promise.all([
        // Total active files
        prisma.uploadedFile.count({
          where: { userId, status: 'active' }
        }),
        
        // Total storage used
        prisma.uploadedFile.aggregate({
          where: { userId, status: 'active' },
          _sum: { size: true }
        }),
        
        // Files by type
        prisma.uploadedFile.groupBy({
          by: ['mimeType'],
          where: { userId, status: 'active' },
          _count: { id: true },
          _sum: { size: true }
        }),
        
        // Recent uploads (last 7 days)
        prisma.uploadedFile.count({
          where: {
            userId,
            status: 'active',
            uploadedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      const systemStats = getUploadStats();

      res.json({
        success: true,
        data: {
          user: {
            totalFiles,
            totalSize: totalSize._sum.size || 0,
            recentUploads,
            filesByType: filesByType.map(item => ({
              mimeType: item.mimeType,
              count: item._count.id,
              totalSize: item._sum.size || 0
            })),
            storageUsagePercent: Math.round(((totalSize._sum.size || 0) / (100 * 1024 * 1024)) * 100) // % of 100MB
          },
          system: {
            maxFileSize: systemStats.configuration.maxFileSize,
            allowedTypes: systemStats.configuration.allowedTypes,
            maxFilesPerUser: 50
          }
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Get upload stats API error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve upload statistics'
      });
    }
  }
);

/**
 * POST /api/uploads/bulk-delete
 * Delete multiple files at once
 */
router.post('/bulk-delete',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { fileIds } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'fileIds array is required',
          errorCode: 'INVALID_INPUT'
        });
      }

      if (fileIds.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 20 files can be deleted at once',
          errorCode: 'BULK_LIMIT_EXCEEDED'
        });
      }

      // Verify all files belong to the user
      const files = await prisma.uploadedFile.findMany({
        where: {
          id: { in: fileIds },
          userId,
          status: 'active'
        }
      });

      if (files.length !== fileIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Some files not found or access denied',
          errorCode: 'PARTIAL_ACCESS_DENIED'
        });
      }

      // Mark all as deleted
      const updateResult = await prisma.uploadedFile.updateMany({
        where: {
          id: { in: fileIds },
          userId
        },
        data: {
          status: 'deleted',
          deletedAt: new Date()
        }
      });

      // Attempt to delete from storage (non-blocking)
      const deletionResults = await Promise.allSettled(
        fileIds.map(fileId => deleteFile(fileId, userId))
      );

      const storageDeleteSuccessCount = deletionResults.filter(
        result => result.status === 'fulfilled'
      ).length;

      logger.info('Bulk file deletion completed', {
        userId,
        requestedCount: fileIds.length,
        dbDeletedCount: updateResult.count,
        storageDeletedCount: storageDeleteSuccessCount
      });

      res.json({
        success: true,
        message: `${updateResult.count} files deleted successfully`,
        data: {
          deletedCount: updateResult.count,
          storageCleanupCount: storageDeleteSuccessCount
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Bulk delete API error', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete files'
      });
    }
  }
);

export default router;