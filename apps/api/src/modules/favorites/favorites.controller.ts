import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { User } from '@repo/database';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async getUserFavorites(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getUserFavorites(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('ids')
  async getFavoriteIds(@CurrentUser() user: User) {
    return this.favoritesService.getFavoriteIds(user.id);
  }

  @Get(':propertyId/check')
  async checkFavorite(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.checkFavorite(user.id, propertyId);
  }

  @Post(':propertyId')
  async addFavorite(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.addFavorite(user.id, propertyId);
  }

  @Delete(':propertyId')
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.removeFavorite(user.id, propertyId);
  }
}
