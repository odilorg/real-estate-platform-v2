import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getPropertyReviews(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
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

    const stats = await this.getPropertyReviewStats(propertyId);

    return { reviews, stats };
  }

  async getPropertyReviewStats(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { propertyId, approved: true },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    reviews.forEach((r) => {
      ratingDistribution[r.rating]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  async createReview(
    userId: string,
    propertyId: string,
    data: { rating: number; comment: string },
  ) {
    // Check if property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check if user is the property owner
    if (property.userId === userId) {
      throw new ForbiddenException('Cannot review your own property');
    }

    // Check if user already reviewed this property
    const existingReview = await this.prisma.review.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this property');
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.review.create({
      data: {
        propertyId,
        userId,
        rating: data.rating,
        comment: data.comment,
        approved: true, // Auto-approve for now
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
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string },
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        comment: data.comment,
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
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true };
  }

  async getUserReview(propertyId: string, userId: string) {
    return this.prisma.review.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
  }
}
