import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '@repo/database';
import { z } from 'zod';

const CreateReviewDto = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});

const UpdateReviewDto = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).optional(),
});

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('property/:propertyId')
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @Public()
  @Get('property/:propertyId/stats')
  getPropertyReviewStats(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviewStats(propertyId);
  }

  @Get('property/:propertyId/my')
  @UseGuards(JwtAuthGuard)
  getUserReview(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.getUserReview(propertyId, user.id);
  }

  @Post('property/:propertyId')
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: User,
    @Body() dto: z.infer<typeof CreateReviewDto>,
  ) {
    const validated = CreateReviewDto.parse(dto);
    return this.reviewsService.createReview(user.id, propertyId, validated);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: z.infer<typeof UpdateReviewDto>,
  ) {
    const validated = UpdateReviewDto.parse(dto);
    return this.reviewsService.updateReview(id, user.id, validated);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteReview(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reviewsService.deleteReview(id, user.id);
  }
}
