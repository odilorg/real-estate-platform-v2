import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCollectionDto, UpdateCollectionDto, AddPropertyToCollectionDto } from '@repo/shared';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.collectionsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.collectionsService.findOne(id, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.collectionsService.delete(id, req.user.id);
  }

  @Post(':id/properties')
  addProperty(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddPropertyToCollectionDto,
  ) {
    return this.collectionsService.addProperty(id, req.user.id, dto);
  }

  @Delete(':id/properties/:propertyId')
  removeProperty(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    return this.collectionsService.removeProperty(id, propertyId, req.user.id);
  }
}
