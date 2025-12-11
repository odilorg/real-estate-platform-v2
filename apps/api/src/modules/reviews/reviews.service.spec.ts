import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  mockPrismaService,
  resetMocks,
  TestFactories,
} from '../../test/test-utils';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = mockPrismaService;
  });

  describe('getPropertyReviews', () => {
    it('should return reviews with stats for a property', async () => {
      const propertyId = 'prop-123';

      const mockReviews = Array.from({ length: 3 }, (_, i) => ({
        id: `review-${i}`,
        propertyId,
        userId: `user-${i}`,
        rating: i + 3,
        comment: `Great property! ${i}`,
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: `user-${i}`,
          firstName: `User`,
          lastName: `${i}`,
        },
      }));

      prisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getPropertyReviews(propertyId);

      expect(result.reviews).toHaveLength(3);
      expect(result.reviews[0].rating).toBe(3);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalReviews).toBe(3);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { propertyId, approved: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty reviews array if no reviews exist', async () => {
      const propertyId = 'prop-123';

      prisma.review.findMany.mockResolvedValue([]);

      const result = await service.getPropertyReviews(propertyId);

      expect(result.reviews).toHaveLength(0);
      expect(result.stats.totalReviews).toBe(0);
      expect(result.stats.averageRating).toBe(0);
    });

    it('should include user information with reviews', async () => {
      const propertyId = 'prop-123';

      const mockReviews = [
        {
          id: 'review-123',
          propertyId,
          userId: 'user-123',
          rating: 5,
          comment: 'Excellent!',
          approved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      prisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getPropertyReviews(propertyId);

      expect(result.reviews[0].user).toBeDefined();
      expect(result.reviews[0].user.firstName).toBe('John');
      expect(result.reviews[0].user.lastName).toBe('Doe');
    });
  });

  describe('getPropertyReviewStats', () => {
    it('should calculate average rating and distribution correctly', async () => {
      const propertyId = 'prop-123';

      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
      ];

      prisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getPropertyReviewStats(propertyId);

      expect(result.averageRating).toBe(3.8); // (5+5+4+3+2) / 5 = 3.8
      expect(result.totalReviews).toBe(5);
      expect(result.ratingDistribution[5]).toBe(2);
      expect(result.ratingDistribution[4]).toBe(1);
      expect(result.ratingDistribution[3]).toBe(1);
      expect(result.ratingDistribution[2]).toBe(1);
      expect(result.ratingDistribution[1]).toBe(0);
    });

    it('should return zero stats for property with no reviews', async () => {
      const propertyId = 'prop-123';

      prisma.review.findMany.mockResolvedValue([]);

      const result = await service.getPropertyReviewStats(propertyId);

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.ratingDistribution).toEqual({});
    });

    it('should round average rating to one decimal place', async () => {
      const propertyId = 'prop-123';

      const mockReviews = [{ rating: 5 }, { rating: 4 }, { rating: 4 }];

      prisma.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getPropertyReviewStats(propertyId);

      // (5 + 4 + 4) / 3 = 13/3 = 4.333... rounded to 4.3
      expect(result.averageRating).toBe(4.3);
    });

    it('should only count approved reviews', async () => {
      const propertyId = 'prop-123';

      prisma.review.findMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }]);

      await service.getPropertyReviewStats(propertyId);

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { propertyId, approved: true },
        select: { rating: true },
      });
    });
  });

  describe('createReview', () => {
    const userId = 'user-123';
    const propertyId = 'prop-123';
    const reviewData = { rating: 5, comment: 'Great property!' };

    it('should create a review successfully', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      const mockReview = {
        id: 'review-123',
        propertyId,
        userId,
        rating: 5,
        comment: 'Great property!',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue(mockReview);

      const result = await service.createReview(userId, propertyId, reviewData);

      expect(result).toEqual(mockReview);
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Great property!');
      expect(result.approved).toBe(true);
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          propertyId,
          userId,
          rating: 5,
          comment: 'Great property!',
          approved: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(userId, propertyId, reviewData),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is property owner', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId, // Same as review creator
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.createReview(userId, propertyId, reviewData),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already reviewed the property', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      const existingReview = {
        id: 'review-existing',
        propertyId,
        userId,
        rating: 3,
        comment: 'Okay property',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findUnique.mockResolvedValue(existingReview);

      await expect(
        service.createReview(userId, propertyId, reviewData),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if rating is below 1', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(userId, propertyId, { ...reviewData, rating: 0 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if rating is above 5', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(userId, propertyId, { ...reviewData, rating: 6 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('should accept all valid rating values (1-5)', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      for (let rating = 1; rating <= 5; rating++) {
        prisma.property.findUnique.mockResolvedValue(mockProperty);
        prisma.review.findUnique.mockResolvedValue(null);
        prisma.review.create.mockResolvedValue({
          id: `review-${rating}`,
          propertyId,
          userId,
          rating,
          comment: 'Test',
          approved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: userId,
            firstName: 'John',
            lastName: 'Doe',
          },
        });

        const result = await service.createReview(userId, propertyId, {
          rating,
          comment: 'Test',
        });

        expect(result.rating).toBe(rating);
      }

      expect(prisma.review.create).toHaveBeenCalledTimes(5);
    });

    it('should create review with different comment lengths', async () => {
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      const comments = [
        'Good',
        'This is a longer comment with more details',
        'A very long comment that describes the property in detail with multiple sentences and lots of information about the experience',
      ];

      for (const comment of comments) {
        prisma.property.findUnique.mockResolvedValue(mockProperty);
        prisma.review.findUnique.mockResolvedValue(null);
        prisma.review.create.mockResolvedValue({
          id: 'review-123',
          propertyId,
          userId,
          rating: 4,
          comment,
          approved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: userId,
            firstName: 'John',
            lastName: 'Doe',
          },
        });

        const result = await service.createReview(userId, propertyId, {
          rating: 4,
          comment,
        });

        expect(result.comment).toBe(comment);
      }
    });
  });

  describe('updateReview', () => {
    const reviewId = 'review-123';
    const userId = 'user-123';

    it('should update review successfully', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedReview = {
        ...mockReview,
        rating: 5,
        comment: 'Updated comment',
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue(updatedReview);

      const result = await service.updateReview(reviewId, userId, {
        rating: 5,
        comment: 'Updated comment',
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Updated comment');
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: {
          rating: 5,
          comment: 'Updated comment',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if review does not exist', async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReview(reviewId, userId, { rating: 4 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not review owner', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId: 'different-user-456',
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.updateReview(reviewId, userId, { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if rating is invalid', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.updateReview(reviewId, userId, { rating: 10 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });

    it('should allow updating only rating without comment', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Original comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedReview = {
        ...mockReview,
        rating: 5,
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue(updatedReview);

      const result = await service.updateReview(reviewId, userId, {
        rating: 5,
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Original comment');
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: {
          rating: 5,
          comment: undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should allow updating only comment without rating', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedReview = {
        ...mockReview,
        comment: 'New comment',
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue(updatedReview);

      const result = await service.updateReview(reviewId, userId, {
        comment: 'New comment',
      });

      expect(result.comment).toBe('New comment');
      expect(result.rating).toBe(3);
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: {
          rating: undefined,
          comment: 'New comment',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should validate rating only if provided', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedReview = {
        ...mockReview,
        comment: 'New comment',
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue(updatedReview);

      // Should not throw when rating is not provided
      const result = await service.updateReview(reviewId, userId, {
        comment: 'New comment',
      });
      expect(result).toBeDefined();
    });

    it('should reject rating below 1', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.updateReview(reviewId, userId, { rating: 0 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });

    it('should reject rating above 5', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 3,
        comment: 'Old comment',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.updateReview(reviewId, userId, { rating: 6 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    const reviewId = 'review-123';
    const userId = 'user-123';

    it('should delete review successfully', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId,
        rating: 5,
        comment: 'Great property!',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReview(reviewId, userId);

      expect(result).toEqual({ success: true });
      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });

    it('should throw NotFoundException if review does not exist', async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReview(reviewId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not review owner', async () => {
      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId: 'different-user-456',
        rating: 5,
        comment: 'Great property!',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(service.deleteReview(reviewId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });

    it('should only allow owner to delete their review', async () => {
      const reviewOwner = 'owner-user-123';
      const otherUser = 'other-user-456';

      const mockReview = {
        id: reviewId,
        propertyId: 'prop-123',
        userId: reviewOwner,
        rating: 5,
        comment: 'Great property!',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      // Owner should be able to delete
      prisma.review.delete.mockResolvedValue(mockReview);
      const ownerResult = await service.deleteReview(reviewId, reviewOwner);
      expect(ownerResult.success).toBe(true);

      // Other user should not be able to delete
      await expect(service.deleteReview(reviewId, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserReview', () => {
    const propertyId = 'prop-123';
    const userId = 'user-123';

    it('should return user review for a property', async () => {
      const mockReview = {
        id: 'review-123',
        propertyId,
        userId,
        rating: 5,
        comment: 'Great property!',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.getUserReview(propertyId, userId);

      expect(result).toEqual(mockReview);
      expect(result!.userId).toBe(userId);
      expect(result!.propertyId).toBe(propertyId);
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          propertyId_userId: {
            propertyId,
            userId,
          },
        },
      });
    });

    it('should return null if user has not reviewed the property', async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      const result = await service.getUserReview(propertyId, userId);

      expect(result).toBeNull();
    });

    it('should use composite key to find unique review', async () => {
      const mockReview = TestFactories.createReview({
        propertyId,
        userId,
        rating: 4,
      });

      prisma.review.findUnique.mockResolvedValue(mockReview);

      await service.getUserReview(propertyId, userId);

      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          propertyId_userId: {
            propertyId,
            userId,
          },
        },
      });
    });

    it('should handle different users on same property', async () => {
      const property = 'prop-123';
      const user1 = 'user-1';
      const user2 = 'user-2';

      const review1 = {
        id: 'review-1',
        propertyId: property,
        userId: user1,
        rating: 5,
        comment: 'User 1 review',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const review2 = {
        id: 'review-2',
        propertyId: property,
        userId: user2,
        rating: 3,
        comment: 'User 2 review',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call returns user1's review
      prisma.review.findUnique.mockResolvedValueOnce(review1);
      let result = await service.getUserReview(property, user1);
      expect(result!.userId).toBe(user1);

      // Second call returns user2's review
      prisma.review.findUnique.mockResolvedValueOnce(review2);
      result = await service.getUserReview(property, user2);
      expect(result!.userId).toBe(user2);
    });

    it('should handle same user reviewing different properties', async () => {
      const user = 'user-123';
      const prop1 = 'prop-1';
      const prop2 = 'prop-2';

      const review1 = {
        id: 'review-1',
        propertyId: prop1,
        userId: user,
        rating: 5,
        comment: 'Property 1 review',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const review2 = {
        id: 'review-2',
        propertyId: prop2,
        userId: user,
        rating: 4,
        comment: 'Property 2 review',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call returns review of prop1
      prisma.review.findUnique.mockResolvedValueOnce(review1);
      let result = await service.getUserReview(prop1, user);
      expect(result!.propertyId).toBe(prop1);

      // Second call returns review of prop2
      prisma.review.findUnique.mockResolvedValueOnce(review2);
      result = await service.getUserReview(prop2, user);
      expect(result!.propertyId).toBe(prop2);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete review lifecycle: create, update, delete', async () => {
      const userId = 'user-123';
      const propertyId = 'prop-123';

      // Create review
      const mockProperty = TestFactories.createProperty({
        id: propertyId,
        userId: 'property-owner-123',
      });

      const createdReview = {
        id: 'review-123',
        propertyId,
        userId,
        rating: 3,
        comment: 'Good property',
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue(createdReview);

      const createResult = await service.createReview(userId, propertyId, {
        rating: 3,
        comment: 'Good property',
      });

      expect(createResult.rating).toBe(3);

      // Update review
      const updatedReview = {
        ...createdReview,
        rating: 5,
        comment: 'Actually, great property!',
      };

      prisma.review.findUnique.mockResolvedValue(createdReview);
      prisma.review.update.mockResolvedValue(updatedReview);

      const updateResult = await service.updateReview('review-123', userId, {
        rating: 5,
        comment: 'Actually, great property!',
      });

      expect(updateResult.rating).toBe(5);

      // Delete review
      prisma.review.findUnique.mockResolvedValue(updatedReview);
      prisma.review.delete.mockResolvedValue(updatedReview);

      const deleteResult = await service.deleteReview('review-123', userId);

      expect(deleteResult.success).toBe(true);
    });

    it('should retrieve stats after multiple reviews', async () => {
      const propertyId = 'prop-123';

      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 },
      ];

      prisma.review.findMany.mockResolvedValue(mockReviews);

      const stats = await service.getPropertyReviewStats(propertyId);

      expect(stats.totalReviews).toBe(6);
      expect(stats.averageRating).toBe(3.3); // (5+5+4+3+2+1) / 6 = 20/6 = 3.333... rounded to 3.3
      expect(stats.ratingDistribution[1]).toBe(1);
      expect(stats.ratingDistribution[2]).toBe(1);
      expect(stats.ratingDistribution[3]).toBe(1);
      expect(stats.ratingDistribution[4]).toBe(1);
      expect(stats.ratingDistribution[5]).toBe(2);
    });
  });
});
