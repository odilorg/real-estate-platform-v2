import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  mockPrismaService,
  resetMocks,
  TestFactories,
} from '../../test/test-utils';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: typeof mockPrismaService;
  let messagesGateway: jest.Mocked<
    Pick<MessagesGateway, 'emitNewMessage' | 'emitNewConversation'>
  >;

  beforeEach(async () => {
    resetMocks();

    // Create mock for MessagesGateway
    const mockMessagesGateway = {
      emitNewMessage: jest.fn(),
      emitNewConversation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MessagesGateway,
          useValue: mockMessagesGateway,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = mockPrismaService;
    messagesGateway = module.get(MessagesGateway);
  });

  describe('getConversations', () => {
    it('should return enriched conversations for a user', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const propertyId = 'prop-123';

      const mockConversation = TestFactories.createConversation({
        id: 'conv-123',
        participant1Id: userId,
        participant2Id: otherUserId,
        propertyId,
        property: {
          id: propertyId,
          title: 'Test Property',
          images: [{ url: 'image.jpg', isPrimary: true }],
        },
        messages: [
          TestFactories.createMessage({
            content: 'Latest message',
            createdAt: new Date(),
          }),
        ],
      });

      const mockOtherUser = {
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      };

      prisma.conversation.findMany.mockResolvedValue([mockConversation]);
      prisma.user.findUnique.mockResolvedValue(mockOtherUser as any);
      prisma.message.count.mockResolvedValue(2);

      const result = await service.getConversations(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv-123');
      expect(result[0].otherParticipant).toEqual({
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result[0].unreadCount).toBe(2);
      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
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
    });

    it('should determine other participant correctly when user is participant2', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';

      const mockConversation = TestFactories.createConversation({
        participant1Id: otherUserId,
        participant2Id: userId,
        messages: [],
      });

      const mockOtherUser = {
        id: otherUserId,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      prisma.conversation.findMany.mockResolvedValue([mockConversation]);
      prisma.user.findUnique.mockResolvedValue(mockOtherUser as any);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getConversations(userId);

      expect(result[0].otherParticipant?.id).toBe(otherUserId);
      expect(result[0].otherParticipant?.firstName).toBe('Jane');
    });

    it('should return empty array when user has no conversations', async () => {
      const userId = 'user-123';

      prisma.conversation.findMany.mockResolvedValue([]);

      const result = await service.getConversations(userId);

      expect(result).toEqual([]);
    });

    it('should calculate unread count correctly', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';

      const mockConversation = TestFactories.createConversation({
        id: 'conv-123',
        participant1Id: userId,
        participant2Id: otherUserId,
        messages: [],
      });

      prisma.conversation.findMany.mockResolvedValue([mockConversation]);
      prisma.user.findUnique.mockResolvedValue({
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      } as any);
      prisma.message.count.mockResolvedValue(5);

      const result = await service.getConversations(userId);

      expect(result[0].unreadCount).toBe(5);
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-123',
          senderId: { not: userId },
          read: false,
        },
      });
    });
  });

  describe('getConversation', () => {
    it('should return conversation with other participant info', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: otherUserId,
        property: {
          id: 'prop-123',
          title: 'Test Property',
          price: 100000,
          images: [],
        },
      });

      const mockOtherUser = {
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      };

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue(mockOtherUser as any);

      const result = await service.getConversation(conversationId, userId);

      expect(result.id).toBe(conversationId);
      expect(result.otherParticipant).toEqual({
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';

      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversation(conversationId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';

      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: 'other-user-1',
        participant2Id: 'other-user-2',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        service.getConversation(conversationId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access if user is participant1', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: otherUserId,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue({
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const result = await service.getConversation(conversationId, userId);

      expect(result.id).toBe(conversationId);
    });

    it('should allow access if user is participant2', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: otherUserId,
        participant2Id: userId,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue({
        id: otherUserId,
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const result = await service.getConversation(conversationId, userId);

      expect(result.id).toBe(conversationId);
    });
  });

  describe('getMessages', () => {
    const conversationId = 'conv-123';
    const userId = 'user-123';

    it('should return paginated messages', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessages = Array.from({ length: 5 }, (_, i) =>
        TestFactories.createMessage({
          id: `msg-${i}`,
          conversationId,
          content: `Message ${i}`,
        }),
      );

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(15);
      prisma.message.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.getMessages(conversationId, userId, 1, 5);

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getMessages(conversationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: 'other-user-1',
        participant2Id: 'other-user-2',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.getMessages(conversationId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should mark messages as read', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessages = [TestFactories.createMessage({ conversationId })];

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(1);
      prisma.message.updateMany.mockResolvedValue({ count: 1 });

      await service.getMessages(conversationId, userId);

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId,
          senderId: { not: userId },
          read: false,
        },
        data: { read: true, readAt: expect.any(Date) },
      });
    });

    it('should handle pagination correctly', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(0);
      prisma.message.updateMany.mockResolvedValue({ count: 0 });

      await service.getMessages(conversationId, userId, 2, 10);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page 2 - 1) * 10
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(0);
      prisma.message.updateMany.mockResolvedValue({ count: 0 });

      await service.getMessages(conversationId, userId);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50, // default limit
      });
    });

    it('should reverse messages to show chronological order', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessages = [
        TestFactories.createMessage({ id: 'msg-3', content: 'Third' }),
        TestFactories.createMessage({ id: 'msg-2', content: 'Second' }),
        TestFactories.createMessage({ id: 'msg-1', content: 'First' }),
      ];

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(3);
      prisma.message.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.getMessages(conversationId, userId);

      expect(result.items[0].id).toBe('msg-1');
      expect(result.items[1].id).toBe('msg-2');
      expect(result.items[2].id).toBe('msg-3');
    });
  });

  describe('startConversation', () => {
    const userId = 'user-123';
    const propertyId = 'prop-123';
    const propertyOwnerId = 'owner-456';
    const message = 'Hello, I am interested in this property';

    it('should create a new conversation when none exists', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: propertyOwnerId,
      });

      const mockConversation = TestFactories.createConversation({
        id: 'conv-123',
        propertyId,
        participant1Id: userId,
        participant2Id: propertyOwnerId,
        property: {
          id: propertyId,
          title: 'Test Property',
          images: [],
        },
        messages: [
          TestFactories.createMessage({
            id: 'msg-123',
            senderId: userId,
            content: message,
          }),
        ],
      });

      const mockSender = TestFactories.createUser({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue(mockSender);

      const result = await service.startConversation(
        userId,
        propertyId,
        message,
      );

      expect(result.conversation.id).toBe('conv-123');
      expect(result.message.content).toBe(message);
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          participant1Id: userId,
          participant2Id: propertyOwnerId,
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
    });

    it('should add message to existing conversation', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: propertyOwnerId,
      });

      const existingConversation = TestFactories.createConversation({
        id: 'conv-123',
        propertyId,
        participant1Id: userId,
        participant2Id: propertyOwnerId,
      });

      const newMessage = TestFactories.createMessage({
        id: 'msg-456',
        conversationId: 'conv-123',
        senderId: userId,
        content: message,
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.conversation.findFirst.mockResolvedValue(existingConversation);
      prisma.message.create.mockResolvedValue(newMessage);
      prisma.conversation.update.mockResolvedValue(existingConversation);

      const result = await service.startConversation(
        userId,
        propertyId,
        message,
      );

      expect(result.conversation.id).toBe('conv-123');
      expect(result.message.id).toBe('msg-456');
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          senderId: userId,
          content: message,
        },
      });
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.startConversation(userId, propertyId, message),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tries to message themselves', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId, // Same as sender
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.startConversation(userId, propertyId, message),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should emit new conversation event to property owner', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: propertyOwnerId,
      });

      const mockConversation = TestFactories.createConversation({
        id: 'conv-123',
        propertyId,
        participant1Id: userId,
        participant2Id: propertyOwnerId,
        property: {
          id: propertyId,
          title: 'Test Property',
          images: [],
        },
        messages: [
          TestFactories.createMessage({
            id: 'msg-123',
            senderId: userId,
            content: message,
            createdAt: new Date('2023-01-01'),
          }),
        ],
      });

      const mockSender = TestFactories.createUser({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue(mockSender);

      await service.startConversation(userId, propertyId, message);

      expect(messagesGateway.emitNewConversation).toHaveBeenCalledWith(
        propertyOwnerId,
        expect.objectContaining({
          id: 'conv-123',
          propertyId,
        }),
      );
    });

    it('should find existing conversation regardless of participant order', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: propertyOwnerId,
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await service
        .startConversation(userId, propertyId, message)
        .catch(() => {});

      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          propertyId,
          OR: [
            { participant1Id: userId, participant2Id: propertyOwnerId },
            { participant1Id: propertyOwnerId, participant2Id: userId },
          ],
        },
      });
    });
  });

  describe('sendMessage', () => {
    const conversationId = 'conv-123';
    const userId = 'user-123';
    const content = 'Hello, this is a test message';

    it('should send a message successfully', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessage = TestFactories.createMessage({
        id: 'msg-123',
        conversationId,
        senderId: userId,
        content,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.conversation.update.mockResolvedValue(mockConversation);

      const result = await service.sendMessage(conversationId, userId, content);

      expect(result.id).toBe('msg-123');
      expect(result.content).toBe(content);
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
      });
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage(conversationId, userId, content),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: 'other-user-1',
        participant2Id: 'other-user-2',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        service.sendMessage(conversationId, userId, content),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update conversation lastMessageAt timestamp', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessage = TestFactories.createMessage({
        conversationId,
        senderId: userId,
        content,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.conversation.update.mockResolvedValue(mockConversation);

      await service.sendMessage(conversationId, userId, content);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('should emit new message event via WebSocket', async () => {
      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: userId,
        participant2Id: 'user-456',
      });

      const mockMessage = TestFactories.createMessage({
        id: 'msg-123',
        conversationId,
        senderId: userId,
        content,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.conversation.update.mockResolvedValue(mockConversation);

      await service.sendMessage(conversationId, userId, content);

      expect(messagesGateway.emitNewMessage).toHaveBeenCalledWith(
        conversationId,
        mockMessage,
      );
    });

    it('should allow both participants to send messages', async () => {
      const user1 = 'user-123';
      const user2 = 'user-456';

      const mockConversation = TestFactories.createConversation({
        id: conversationId,
        participant1Id: user1,
        participant2Id: user2,
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.create.mockResolvedValue(
        TestFactories.createMessage({
          conversationId,
          senderId: user1,
          content,
        }),
      );
      prisma.conversation.update.mockResolvedValue(mockConversation);

      // User 1 sends message
      await expect(
        service.sendMessage(conversationId, user1, content),
      ).resolves.toBeDefined();

      // User 2 sends message
      prisma.message.create.mockResolvedValue(
        TestFactories.createMessage({
          conversationId,
          senderId: user2,
          content,
        }),
      );
      await expect(
        service.sendMessage(conversationId, user2, content),
      ).resolves.toBeDefined();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      const userId = 'user-123';

      const mockConversations = [
        TestFactories.createConversation({ id: 'conv-1' }),
        TestFactories.createConversation({ id: 'conv-2' }),
        TestFactories.createConversation({ id: 'conv-3' }),
      ];

      prisma.conversation.findMany.mockResolvedValue(mockConversations);
      prisma.message.count.mockResolvedValue(7);

      const result = await service.getUnreadCount(userId);

      expect(result.unreadCount).toBe(7);
      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        select: { id: true },
      });
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          conversationId: { in: ['conv-1', 'conv-2', 'conv-3'] },
          senderId: { not: userId },
          read: false,
        },
      });
    });

    it('should return zero when user has no conversations', async () => {
      const userId = 'user-123';

      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(result.unreadCount).toBe(0);
    });

    it('should return zero when all messages are read', async () => {
      const userId = 'user-123';

      const mockConversations = [
        TestFactories.createConversation({ id: 'conv-1' }),
      ];

      prisma.conversation.findMany.mockResolvedValue(mockConversations);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(result.unreadCount).toBe(0);
    });

    it('should only count unread messages from other users', async () => {
      const userId = 'user-123';

      const mockConversations = [
        TestFactories.createConversation({ id: 'conv-1' }),
      ];

      prisma.conversation.findMany.mockResolvedValue(mockConversations);
      prisma.message.count.mockResolvedValue(3);

      await service.getUnreadCount(userId);

      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          conversationId: { in: ['conv-1'] },
          senderId: { not: userId },
          read: false,
        },
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete conversation lifecycle', async () => {
      const userId = 'user-123';
      const propertyOwnerId = 'owner-456';
      const propertyId = 'prop-123';

      // Start conversation
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: propertyOwnerId,
      });

      const firstMessage = TestFactories.createMessage({
        id: 'msg-1',
        senderId: userId,
        content: 'Hello',
      });

      const mockConversation = TestFactories.createConversation({
        id: 'conv-123',
        propertyId,
        participant1Id: userId,
        participant2Id: propertyOwnerId,
        property: {
          id: propertyId,
          title: 'Test Property',
          images: [],
        },
        messages: [firstMessage],
      });

      const mockSender = TestFactories.createUser({ id: userId });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue(mockConversation);
      prisma.user.findUnique.mockResolvedValue(mockSender);

      const startResult = await service.startConversation(
        userId,
        propertyId,
        'Hello',
      );
      expect(startResult.conversation.id).toBe('conv-123');

      // Send message
      const newMessage = TestFactories.createMessage({
        id: 'msg-2',
        conversationId: 'conv-123',
        senderId: userId,
        content: 'Follow up message',
      });

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.create.mockResolvedValue(newMessage);
      prisma.conversation.update.mockResolvedValue(mockConversation);

      const sendResult = await service.sendMessage(
        'conv-123',
        userId,
        'Follow up message',
      );
      expect(sendResult.id).toBe('msg-2');

      // Get messages
      prisma.message.findMany.mockResolvedValue([firstMessage, newMessage]);
      prisma.message.count.mockResolvedValue(2);
      prisma.message.updateMany.mockResolvedValue({ count: 0 });

      const messagesResult = await service.getMessages('conv-123', userId);
      expect(messagesResult.items).toHaveLength(2);
      expect(messagesResult.total).toBe(2);
    });

    it('should handle multiple conversations for a user', async () => {
      const userId = 'user-123';

      const mockConversations = [
        TestFactories.createConversation({
          id: 'conv-1',
          participant1Id: userId,
          participant2Id: 'user-456',
          messages: [],
        }),
        TestFactories.createConversation({
          id: 'conv-2',
          participant1Id: userId,
          participant2Id: 'user-789',
          messages: [],
        }),
      ];

      prisma.conversation.findMany.mockResolvedValue(mockConversations);
      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-456',
          firstName: 'John',
          lastName: 'Doe',
        } as any)
        .mockResolvedValueOnce({
          id: 'user-789',
          firstName: 'Jane',
          lastName: 'Smith',
        } as any);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getConversations(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conv-1');
      expect(result[1].id).toBe('conv-2');
    });

    it('should track unread messages across multiple conversations', async () => {
      const userId = 'user-123';

      const mockConversations = [
        TestFactories.createConversation({ id: 'conv-1' }),
        TestFactories.createConversation({ id: 'conv-2' }),
        TestFactories.createConversation({ id: 'conv-3' }),
      ];

      prisma.conversation.findMany.mockResolvedValue(mockConversations);
      prisma.message.count.mockResolvedValue(12);

      const result = await service.getUnreadCount(userId);

      expect(result.unreadCount).toBe(12);
    });
  });
});
