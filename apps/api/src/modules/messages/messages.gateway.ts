import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub as string;

      if (!userId) {
        this.logger.warn(`Invalid token payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      // Track user's socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user to their personal room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      // Get user's conversations and join conversation rooms
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: client.userId },
            { participant2Id: client.userId },
          ],
        },
        select: { id: true },
      });

      conversations.forEach((conv) => {
        client.join(`conversation:${conv.id}`);
      });

      this.logger.log(
        `User ${client.userId} joined ${conversations.length} conversation rooms`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection error for client ${client.id}:`, errorMessage);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() conversationId: string,
  ) {
    client.join(`conversation:${conversationId}`);
    this.logger.log(
      `User ${client.userId} joined conversation ${conversationId}`,
    );
    return { event: 'joined_conversation', data: conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    this.logger.log(
      `User ${client.userId} left conversation ${conversationId}`,
    );
    return { event: 'left_conversation', data: conversationId };
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    // Verify conversation exists and user is a participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      return { event: 'error', data: 'Conversation not found' };
    }

    if (conversation.participant1Id !== client.userId && conversation.participant2Id !== client.userId) {
      return { event: 'error', data: 'Access denied' };
    }

    // Mark messages as read for this user
    await this.prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: client.userId },
        read: false,
      },
      data: { read: true },
    });

    // Notify other participant
    client.to(`conversation:${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      userId: client.userId,
    });

    return { event: 'marked_as_read', data: data.conversationId };
  }

  // Emit new message to conversation participants
  emitNewMessage(conversationId: string, message: Record<string, unknown>) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  // Emit new conversation to user
  emitNewConversation(userId: string, conversation: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('new_conversation', conversation);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
