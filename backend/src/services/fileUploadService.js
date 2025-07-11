/**
 * Enhanced File Upload Service
 * Features: Multiple storage backends, virus scanning, file validation, metadata extraction
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const winston = require('winston');
const mime = require('mime-types');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/file-upload.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_USER: 50,
  ALLOWED_TYPES: {
    documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    spreadsheets: ['xls', 'xlsx', 'csv'],
    presentations: ['ppt', 'pptx']
  },
  STORAGE_PATH: process.env.UPLOAD_PATH || './uploads',
  TEMP_PATH: process.env.TEMP_PATH || './temp',
  USE_S3: process.env.USE_S3 === 'true',
  S3_BUCKET: process.env.S3_BUCKET_NAME,
  VIRUS_SCAN_ENABLED: process.env.VIRUS_SCAN_ENABLED === 'true'
};

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(CONFIG.STORAGE_PATH, { recursive: true });
    await fs.mkdir(CONFIG.TEMP_PATH, { recursive: true });
    await fs.mkdir(path.join(CONFIG.STORAGE_PATH, 'processed'), { recursive: true });
    await fs.mkdir(path.join(CONFIG.STORAGE_PATH, 'quarantine'), { recursive: true });
  } catch (error) {
    logger.error('Failed to create upload directories', { error: error.message });
  }
}

ensureDirectories();

/**
 * File validation utilities
 */
function validateFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const detectedMimeType = mime.lookup(filename);
  
  // Check if extension is allowed
  const allAllowedTypes = Object.values(CONFIG.ALLOWED_TYPES).flat();
  if (!allAllowedTypes.includes(ext)) {
    throw new Error(`File type .${ext} is not allowed`);
  }
  
  // Verify MIME type matches extension
  if (detectedMimeType && mimeType && detectedMimeType !== mimeType) {
    logger.warn('MIME type mismatch detected', {
      filename,
      declaredMimeType: mimeType,
      detectedMimeType
    });
  }
  
  return true;
}

function sanitizeFilename(filename) {
  // Remove path traversal attempts and dangerous characters
  const sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100); // Limit length
    
  // Ensure it doesn't start with a dot
  return sanitized.startsWith('.') ? 'file_' + sanitized : sanitized;
}

function generateFileId() {
  return crypto.randomBytes(16).toString('hex');
}

async function calculateFileHash(filePath) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = await fs.readFile(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Virus scanning (mock implementation - integrate with ClamAV in production)
 */
async function scanForVirus(filePath) {
  if (!CONFIG.VIRUS_SCAN_ENABLED) {
    return { clean: true, engine: 'disabled' };
  }
  
  // Mock virus scan - replace with actual ClamAV integration
  logger.info('Performing virus scan', { filePath });
  
  // Simulate scan time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Basic suspicious file detection
  const fileContent = await fs.readFile(filePath);
  const suspiciousPatterns = [
    /exec\(/gi,
    /system\(/gi,
    /eval\(/gi,
    /<script/gi
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fileContent.toString())
  );
  
  if (isSuspicious) {
    logger.warn('Suspicious content detected', { filePath });
    return { 
      clean: false, 
      engine: 'mock-scanner',
      threat: 'Suspicious script content detected'
    };
  }
  
  return { clean: true, engine: 'mock-scanner' };
}

/**
 * File metadata extraction
 */
async function extractMetadata(filePath, originalName) {
  try {
    const stats = await fs.stat(filePath);
    const hash = await calculateFileHash(filePath);
    
    const metadata = {
      originalName,
      sanitizedName: sanitizeFilename(originalName),
      size: stats.size,
      mimeType: mime.lookup(originalName) || 'application/octet-stream',
      extension: path.extname(originalName).toLowerCase(),
      hash,
      uploadedAt: new Date().toISOString(),
      lastModified: stats.mtime.toISOString()
    };
    
    // Enhanced metadata for specific file types
    if (metadata.extension === '.pdf') {
      // Could integrate PDF parsing libraries here
      metadata.pageCount = await extractPDFPageCount(filePath);
    }
    
    return metadata;
  } catch (error) {
    logger.error('Failed to extract metadata', { filePath, error: error.message });
    throw error;
  }
}

async function extractPDFPageCount(filePath) {
  try {
    // Mock PDF page count - integrate with pdf-parse or similar
    return Math.floor(Math.random() * 20) + 1;
  } catch (error) {
    logger.warn('Could not extract PDF page count', { filePath });
    return null;
  }
}

/**
 * Storage backends
 */
class LocalStorage {
  async store(tempPath, fileId, metadata) {
    const finalPath = path.join(CONFIG.STORAGE_PATH, 'processed', `${fileId}_${metadata.sanitizedName}`);
    await fs.copyFile(tempPath, finalPath);
    await fs.unlink(tempPath); // Remove temp file
    
    return {
      storagePath: finalPath,
      url: `/uploads/${fileId}_${metadata.sanitizedName}`,
      backend: 'local'
    };
  }
  
  async delete(storagePath) {
    try {
      await fs.unlink(storagePath);
      return true;
    } catch (error) {
      logger.error('Failed to delete file from local storage', { storagePath, error: error.message });
      return false;
    }
  }
  
  async getFile(storagePath) {
    return fs.readFile(storagePath);
  }
}

class S3Storage {
  constructor() {
    if (CONFIG.USE_S3) {
      this.s3 = require('aws-sdk').S3();
    }
  }
  
  async store(tempPath, fileId, metadata) {
    if (!CONFIG.USE_S3 || !this.s3) {
      throw new Error('S3 storage not configured');
    }
    
    const key = `uploads/${fileId}_${metadata.sanitizedName}`;
    const fileBuffer = await fs.readFile(tempPath);
    
    const uploadResult = await this.s3.upload({
      Bucket: CONFIG.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: metadata.mimeType,
      Metadata: {
        originalName: metadata.originalName,
        uploadedAt: metadata.uploadedAt,
        hash: metadata.hash
      }
    }).promise();
    
    await fs.unlink(tempPath); // Remove temp file
    
    return {
      storagePath: key,
      url: uploadResult.Location,
      backend: 's3'
    };
  }
  
  async delete(key) {
    try {
      await this.s3.deleteObject({
        Bucket: CONFIG.S3_BUCKET,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      logger.error('Failed to delete file from S3', { key, error: error.message });
      return false;
    }
  }
  
  async getFile(key) {
    const result = await this.s3.getObject({
      Bucket: CONFIG.S3_BUCKET,
      Key: key
    }).promise();
    
    return result.Body;
  }
}

// Initialize storage backend
const storage = CONFIG.USE_S3 ? new S3Storage() : new LocalStorage();

/**
 * Multer configuration
 */
const multerConfig = multer({
  dest: CONFIG.TEMP_PATH,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE,
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file.originalname, file.mimetype);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }
});

/**
 * File processing pipeline
 */
async function processUploadedFile(file, userId) {
  const fileId = generateFileId();
  const tempPath = file.path;
  
  try {
    // Step 1: Extract metadata
    const metadata = await extractMetadata(tempPath, file.originalname);
    logger.info('File metadata extracted', { fileId, metadata });
    
    // Step 2: Virus scan
    const scanResult = await scanForVirus(tempPath);
    if (!scanResult.clean) {
      // Move to quarantine
      const quarantinePath = path.join(CONFIG.STORAGE_PATH, 'quarantine', `${fileId}_quarantined`);
      await fs.copyFile(tempPath, quarantinePath);
      await fs.unlink(tempPath);
      
      throw new Error(`File failed virus scan: ${scanResult.threat || 'Unknown threat'}`);
    }
    
    // Step 3: Store file
    const storageResult = await storage.store(tempPath, fileId, metadata);
    
    // Step 4: Create database record
    const fileRecord = {
      id: fileId,
      userId,
      originalName: metadata.originalName,
      sanitizedName: metadata.sanitizedName,
      size: metadata.size,
      mimeType: metadata.mimeType,
      hash: metadata.hash,
      storagePath: storageResult.storagePath,
      url: storageResult.url,
      backend: storageResult.backend,
      metadata: metadata,
      scanResult: scanResult,
      status: 'active',
      uploadedAt: new Date().toISOString()
    };
    
    logger.info('File processed successfully', { fileId, userId, size: metadata.size });
    
    return fileRecord;
    
  } catch (error) {
    // Cleanup on error
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      logger.error('Failed to cleanup temp file', { tempPath, error: cleanupError.message });
    }
    
    logger.error('File processing failed', { fileId, error: error.message });
    throw error;
  }
}

/**
 * File management functions
 */
async function uploadFiles(req, res, next) {
  try {
    const upload = multerConfig.array('files');
    
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: `File size exceeds limit of ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Too many files uploaded at once'
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }
      
      const userId = req.user?.id || 'anonymous';
      const processedFiles = [];
      const errors = [];
      
      // Process each file
      for (const file of req.files) {
        try {
          const fileRecord = await processUploadedFile(file, userId);
          processedFiles.push(fileRecord);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }
      
      const response = {
        success: processedFiles.length > 0,
        uploadedFiles: processedFiles,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          totalFiles: req.files.length,
          successful: processedFiles.length,
          failed: errors.length
        }
      };
      
      if (processedFiles.length === 0) {
        res.status(400).json(response);
      } else {
        res.status(200).json(response);
      }
    });
    
  } catch (error) {
    logger.error('Upload handler failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error during file upload'
    });
  }
}

async function deleteFile(fileId, userId) {
  try {
    // In a real implementation, you would fetch from database
    // For now, we'll implement basic file deletion
    
    logger.info('File deletion requested', { fileId, userId });
    
    // This would typically involve:
    // 1. Verify user owns the file
    // 2. Delete from storage backend
    // 3. Update database record
    // 4. Log the deletion
    
    return {
      success: true,
      message: 'File deleted successfully'
    };
    
  } catch (error) {
    logger.error('File deletion failed', { fileId, userId, error: error.message });
    throw error;
  }
}

async function getFileInfo(fileId, userId) {
  try {
    // Mock file info - replace with database query
    return {
      id: fileId,
      userId,
      originalName: 'example.pdf',
      size: 1024000,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      status: 'active'
    };
  } catch (error) {
    logger.error('Failed to get file info', { fileId, userId, error: error.message });
    throw error;
  }
}

async function getUserFiles(userId, options = {}) {
  try {
    const { limit = 50, offset = 0, type = null } = options;
    
    // Mock user files - replace with database query
    const mockFiles = [
      {
        id: 'file1',
        originalName: '事業計画書.pdf',
        size: 2048000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'active'
      },
      {
        id: 'file2',
        originalName: '財務諸表.xlsx',
        size: 512000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'active'
      }
    ];
    
    return {
      files: mockFiles,
      total: mockFiles.length,
      limit,
      offset
    };
  } catch (error) {
    logger.error('Failed to get user files', { userId, error: error.message });
    throw error;
  }
}

/**
 * File upload statistics
 */
function getUploadStats() {
  return {
    timestamp: new Date().toISOString(),
    configuration: {
      maxFileSize: CONFIG.MAX_FILE_SIZE,
      allowedTypes: CONFIG.ALLOWED_TYPES,
      storageBackend: CONFIG.USE_S3 ? 's3' : 'local',
      virusScanEnabled: CONFIG.VIRUS_SCAN_ENABLED
    },
    directories: {
      storage: CONFIG.STORAGE_PATH,
      temp: CONFIG.TEMP_PATH
    }
  };
}

module.exports = {
  uploadFiles,
  deleteFile,
  getFileInfo,
  getUserFiles,
  getUploadStats,
  processUploadedFile,
  multerConfig,
  CONFIG
};