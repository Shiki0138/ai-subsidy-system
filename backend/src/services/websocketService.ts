/**
 * WebSocket Service - Real-time Communication System
 * Features: Real-time notifications, collaborative editing, system status updates
 */

import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import Redis from 'ioredis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

interface UserConnection {
  socketId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  connectedAt: Date;
  lastActivity: Date;
}

interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  applicationId?: string;
}

interface CollaborationData {
  applicationId: string;
  type: 'cursor' | 'edit' | 'save' | 'lock' | 'unlock';
  data: any;
  userId: string;
  timestamp: string;
}

export class WebSocketService {
  private io: Server;
  private prisma: PrismaClient;
  private redis: Redis;
  private logger: winston.Logger;
  private connections: Map<string, UserConnection> = new Map();
  private applicationRooms: Map<string, Set<string>> = new Map(); // applicationId -> Set of userIds

  constructor(server: HTTPServer, prisma: PrismaClient, redis: Redis, logger: winston.Logger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;

    // Initialize Socket.IO server
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    this.logger.info('WebSocket service initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Get user information from database
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Invalid user or account inactive'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userRole = user.role;

        next();
      } catch (error: any) {
        this.logger.error('WebSocket authentication failed', {
          error: error.message,
          socketId: socket.id
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
      
      // Core event handlers
      socket.on('join-application', (data) => this.handleJoinApplication(socket, data));
      socket.on('leave-application', (data) => this.handleLeaveApplication(socket, data));
      socket.on('collaboration-event', (data) => this.handleCollaborationEvent(socket, data));
      socket.on('request-notification', (data) => this.handleNotificationRequest(socket, data));
      socket.on('typing-start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing-stop', (data) => this.handleTypingStop(socket, data));
      socket.on('ping', () => this.handlePing(socket));
      
      // Disconnect handler
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Handle new connection
   */
  private async handleConnection(socket: AuthenticatedSocket) {
    const { userId, userEmail, userRole } = socket;
    
    if (!userId) return;

    // Store connection info
    const connection: UserConnection = {
      socketId: socket.id,
      userId,
      userEmail: userEmail!,
      userRole: userRole!,
      connectedAt: new Date(),
      lastActivity: new Date()
    };
    
    this.connections.set(socket.id, connection);

    // Join user-specific room for notifications
    await socket.join(`user:${userId}`);

    // Cache connection in Redis
    await this.redis.hset(
      'websocket:connections',
      socket.id,
      JSON.stringify(connection)
    );

    this.logger.info('WebSocket connection established', {
      socketId: socket.id,
      userId,
      userEmail,
      userRole
    });

    // Send connection confirmation
    socket.emit('connection-confirmed', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      userId,
      capabilities: this.getUserCapabilities(userRole!)
    });

    // Send any pending notifications
    await this.sendPendingNotifications(socket, userId);
  }

  /**
   * Handle disconnection
   */
  private async handleDisconnection(socket: AuthenticatedSocket) {
    const connection = this.connections.get(socket.id);
    
    if (connection) {
      // Leave all application rooms
      for (const [applicationId, userIds] of this.applicationRooms.entries()) {
        if (userIds.has(connection.userId)) {
          userIds.delete(connection.userId);
          
          // Notify others in the room
          socket.to(`app:${applicationId}`).emit('user-left-application', {
            userId: connection.userId,
            userEmail: connection.userEmail,
            applicationId,
            timestamp: new Date().toISOString()
          });
          
          if (userIds.size === 0) {
            this.applicationRooms.delete(applicationId);
          }
        }
      }

      this.connections.delete(socket.id);
      await this.redis.hdel('websocket:connections', socket.id);

      this.logger.info('WebSocket disconnection', {
        socketId: socket.id,
        userId: connection.userId,
        duration: Date.now() - connection.connectedAt.getTime()
      });
    }
  }

  /**
   * Handle joining application collaboration room
   */
  private async handleJoinApplication(socket: AuthenticatedSocket, data: { applicationId: string }) {
    const { applicationId } = data;
    const { userId, userEmail } = socket;

    if (!userId || !applicationId) return;

    try {
      // Verify user has access to this application
      const application = await this.prisma.application.findFirst({
        where: {
          id: applicationId,
          OR: [
            { userId }, // User owns the application
            { userId: { in: await this.getCollaboratorIds(userId) } } // User is a collaborator
          ]
        },
        select: {
          id: true,
          title: true,
          status: true,
          user: {
            select: {
              id: true,
              email: true,
              companyName: true
            }
          }
        }
      });

      if (!application) {
        socket.emit('error', {
          type: 'ACCESS_DENIED',
          message: 'この申請書へのアクセス権限がありません'
        });
        return;
      }

      // Join application room
      await socket.join(`app:${applicationId}`);

      // Track active users in application
      if (!this.applicationRooms.has(applicationId)) {
        this.applicationRooms.set(applicationId, new Set());
      }
      this.applicationRooms.get(applicationId)!.add(userId);

      // Get current active users in the room
      const activeUsers = Array.from(this.applicationRooms.get(applicationId)!)
        .map(uid => {
          const conn = Array.from(this.connections.values())
            .find(c => c.userId === uid);
          return conn ? {
            userId: conn.userId,
            userEmail: conn.userEmail,
            userRole: conn.userRole,
            connectedAt: conn.connectedAt
          } : null;
        })
        .filter(Boolean);

      // Notify user of successful join
      socket.emit('application-joined', {
        applicationId,
        application,
        activeUsers,
        timestamp: new Date().toISOString()
      });

      // Notify others in the room
      socket.to(`app:${applicationId}`).emit('user-joined-application', {
        userId,
        userEmail,
        applicationId,
        timestamp: new Date().toISOString()
      });

      this.logger.info('User joined application collaboration', {
        userId,
        applicationId,
        activeUsersCount: activeUsers.length
      });

    } catch (error: any) {
      this.logger.error('Error joining application', {
        userId,
        applicationId,
        error: error.message
      });
      
      socket.emit('error', {
        type: 'JOIN_APPLICATION_ERROR',
        message: 'アプリケーションへの参加に失敗しました'
      });
    }
  }

  /**
   * Handle leaving application collaboration room
   */
  private handleLeaveApplication(socket: AuthenticatedSocket, data: { applicationId: string }) {
    const { applicationId } = data;
    const { userId } = socket;

    if (!userId || !applicationId) return;

    socket.leave(`app:${applicationId}`);

    const userIds = this.applicationRooms.get(applicationId);
    if (userIds) {
      userIds.delete(userId);
      
      if (userIds.size === 0) {
        this.applicationRooms.delete(applicationId);
      }
    }

    // Notify others
    socket.to(`app:${applicationId}`).emit('user-left-application', {
      userId,
      applicationId,
      timestamp: new Date().toISOString()
    });

    this.logger.info('User left application collaboration', {
      userId,
      applicationId
    });
  }

  /**
   * Handle real-time collaboration events
   */
  private async handleCollaborationEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { userId } = socket;
    const { applicationId, type, data: eventData } = data;

    if (!userId || !applicationId) return;

    try {
      // Verify user is in the application room
      const userIds = this.applicationRooms.get(applicationId);
      if (!userIds || !userIds.has(userId)) {
        socket.emit('error', {
          type: 'NOT_IN_ROOM',
          message: 'アプリケーションルームに参加していません'
        });
        return;
      }

      // Process different collaboration event types
      switch (type) {
        case 'edit':
          await this.handleEditEvent(socket, data);
          break;
        case 'save':
          await this.handleSaveEvent(socket, data);
          break;
        case 'lock':
          await this.handleLockEvent(socket, data);
          break;
        case 'unlock':
          await this.handleUnlockEvent(socket, data);
          break;
        case 'cursor':
          await this.handleCursorEvent(socket, data);
          break;
        default:
          this.logger.warn('Unknown collaboration event type', { type, userId, applicationId });
      }

    } catch (error: any) {
      this.logger.error('Error handling collaboration event', {
        userId,
        applicationId,
        type,
        error: error.message
      });
    }
  }

  /**
   * Handle text editing events for real-time collaboration
   */
  private async handleEditEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { applicationId, data: editData, userId } = data;

    // Cache the edit in Redis for conflict resolution
    const editKey = `edit:${applicationId}:${Date.now()}`;
    await this.redis.setex(editKey, 3600, JSON.stringify({
      userId,
      timestamp: new Date().toISOString(),
      editData
    }));

    // Broadcast to other users in the room
    socket.to(`app:${applicationId}`).emit('collaboration-event', {
      type: 'edit',
      applicationId,
      userId,
      data: editData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle save events
   */
  private async handleSaveEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { applicationId, data: saveData, userId } = data;

    try {
      // Update the application in database
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          editedContent: saveData,
          updatedAt: new Date()
        }
      });

      // Broadcast save confirmation to all users in the room
      this.io.to(`app:${applicationId}`).emit('collaboration-event', {
        type: 'save-confirmed',
        applicationId,
        userId,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Application saved via collaboration', {
        applicationId,
        userId
      });

    } catch (error: any) {
      socket.emit('error', {
        type: 'SAVE_ERROR',
        message: '保存に失敗しました'
      });
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: { applicationId: string, section: string }) {
    const { userId } = socket;
    const { applicationId, section } = data;

    socket.to(`app:${applicationId}`).emit('typing-start', {
      userId,
      section,
      timestamp: new Date().toISOString()
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { applicationId: string, section: string }) {
    const { userId } = socket;
    const { applicationId, section } = data;

    socket.to(`app:${applicationId}`).emit('typing-stop', {
      userId,
      section,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle ping for connection health monitoring
   */
  private handlePing(socket: AuthenticatedSocket) {
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.lastActivity = new Date();
    }
    
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      latency: Date.now()
    });
  }

  /**
   * Send notification to specific user or broadcast
   */
  public async sendNotification(notification: NotificationData) {
    try {
      if (notification.userId) {
        // Send to specific user
        this.io.to(`user:${notification.userId}`).emit('notification', notification);
        
        // Store in Redis for offline users
        await this.redis.lpush(
          `notifications:${notification.userId}`,
          JSON.stringify(notification)
        );
        await this.redis.expire(`notifications:${notification.userId}`, 86400); // 24 hours
        
      } else {
        // Broadcast to all connected users
        this.io.emit('notification', notification);
      }

      this.logger.info('Notification sent', {
        type: notification.type,
        userId: notification.userId || 'broadcast',
        title: notification.title
      });

    } catch (error: any) {
      this.logger.error('Error sending notification', {
        error: error.message,
        notification
      });
    }
  }

  /**
   * Send pending notifications to newly connected user
   */
  private async sendPendingNotifications(socket: AuthenticatedSocket, userId: string) {
    try {
      const notifications = await this.redis.lrange(`notifications:${userId}`, 0, -1);
      
      if (notifications.length > 0) {
        const parsedNotifications = notifications.map(n => JSON.parse(n));
        
        socket.emit('pending-notifications', {
          notifications: parsedNotifications,
          count: parsedNotifications.length
        });

        // Clear pending notifications
        await this.redis.del(`notifications:${userId}`);
      }
    } catch (error: any) {
      this.logger.error('Error sending pending notifications', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Get user capabilities based on role
   */
  private getUserCapabilities(role: string): string[] {
    const capabilities = ['receive-notifications', 'join-applications'];
    
    if (role === 'ADMIN') {
      capabilities.push('broadcast-notifications', 'monitor-connections', 'force-disconnect');
    }
    
    if (role === 'SUPPORT') {
      capabilities.push('view-connections', 'send-support-messages');
    }
    
    return capabilities;
  }

  /**
   * Get collaborator IDs for a user (placeholder for future collaboration features)
   */
  private async getCollaboratorIds(userId: string): Promise<string[]> {
    // In the future, this would return IDs of users who can collaborate
    // For now, return empty array
    return [];
  }

  /**
   * Additional event handlers for advanced features
   */
  private async handleLockEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { applicationId, data: lockData, userId } = data;
    
    // Store lock information in Redis
    const lockKey = `lock:${applicationId}:${lockData.section}`;
    await this.redis.setex(lockKey, 300, JSON.stringify({ // 5 minute lock
      userId,
      timestamp: new Date().toISOString(),
      section: lockData.section
    }));

    // Notify other users
    socket.to(`app:${applicationId}`).emit('collaboration-event', {
      type: 'section-locked',
      applicationId,
      userId,
      data: lockData,
      timestamp: new Date().toISOString()
    });
  }

  private async handleUnlockEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { applicationId, data: unlockData, userId } = data;
    
    // Remove lock from Redis
    const lockKey = `lock:${applicationId}:${unlockData.section}`;
    await this.redis.del(lockKey);

    // Notify other users
    socket.to(`app:${applicationId}`).emit('collaboration-event', {
      type: 'section-unlocked',
      applicationId,
      userId,
      data: unlockData,
      timestamp: new Date().toISOString()
    });
  }

  private async handleCursorEvent(socket: AuthenticatedSocket, data: CollaborationData) {
    const { applicationId, data: cursorData, userId } = data;

    // Broadcast cursor position to other users (no storage needed)
    socket.to(`app:${applicationId}`).emit('collaboration-event', {
      type: 'cursor-update',
      applicationId,
      userId,
      data: cursorData,
      timestamp: new Date().toISOString()
    });
  }

  private async handleNotificationRequest(socket: AuthenticatedSocket, data: any) {
    // Handle custom notification requests from clients
    // This can be used for feature requests, support tickets, etc.
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      activeApplications: this.applicationRooms.size,
      connectionsByRole: this.getConnectionsByRole(),
      timestamp: new Date().toISOString()
    };
  }

  private getConnectionsByRole() {
    const roleStats: Record<string, number> = {};
    
    for (const connection of this.connections.values()) {
      roleStats[connection.userRole] = (roleStats[connection.userRole] || 0) + 1;
    }
    
    return roleStats;
  }

  /**
   * Cleanup inactive connections
   */
  public async cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity.getTime() > timeout) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        this.connections.delete(socketId);
        await this.redis.hdel('websocket:connections', socketId);
      }
    }
  }
}

export default WebSocketService;