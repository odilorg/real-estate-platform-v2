import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagesGateway))
    private messagesGateway: MessagesGateway,
  ) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            images: {
              take: 1,
              where: { isPrimary: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get participant info and unread count for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId =
          conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id;

        const otherParticipant = await this.prisma.user.findUnique({
          where: { id: otherParticipantId },
          select: { id: true, firstName: true, lastName: true },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            read: false,
          },
        });

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      }),
    );

    return enrichedConversations;
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            images: {
              take: 1,
              where: { isPrimary: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const otherParticipantId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const otherParticipant = await this.prisma.user.findUnique({
      where: { id: otherParticipantId },
      select: { id: true, firstName: true, lastName: true },
    });

    return { ...conversation, otherParticipant };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    // Verify access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true, readAt: new Date() },
    });

    return {
      items: messages.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async startConversation(userId: string, propertyId: string, message: string) {
    // Get the property owner
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId === userId) {
      throw new ForbiddenException('Cannot message yourself');
    }

    // Check if conversation already exists
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        propertyId,
        OR: [
          { participant1Id: userId, participant2Id: property.userId },
          { participant1Id: property.userId, participant2Id: userId },
        ],
      },
    });

    if (existingConversation) {
      // Add message to existing conversation
      const newMessage = await this.prisma.message.create({
        data: {
          conversationId: existingConversation.id,
          senderId: userId,
          content: message,
        },
      });

      await this.prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { lastMessageAt: new Date() },
      });

      return { conversation: existingConversation, message: newMessage };
    }

    // Create new conversation with first message
    const conversation = await this.prisma.conversation.create({
      data: {
        propertyId,
        participant1Id: userId,
        participant2Id: property.userId,
        messages: {
          create: {
            senderId: userId,
            content: message,
          },
        },
      },
      include: {
        messages: true,
        property: {
          select: {
            id: true,
            title: true,
            images: { take: 1, where: { isPrimary: true } },
          },
        },
      },
    });

    // Get the sender's info for the notification
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });

    // Emit real-time notification to property owner
    this.messagesGateway.emitNewConversation(property.userId, {
      id: conversation.id,
      propertyId: conversation.propertyId,
      property: conversation.property,
      messages: [
        { content: message, createdAt: conversation.messages[0].createdAt },
      ],
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 1,
      otherParticipant: sender,
    });

    return { conversation, message: conversation.messages[0] };
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    // Verify access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Emit real-time event via WebSocket
    this.messagesGateway.emitNewMessage(conversationId, message);

    return message;
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: { id: true },
    });

    const count = await this.prisma.message.count({
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        read: false,
      },
    });

    return { unreadCount: count };
  }
}
