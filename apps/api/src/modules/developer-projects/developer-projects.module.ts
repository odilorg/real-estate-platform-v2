import { Module } from '@nestjs/common';
import { DeveloperProjectsController } from './developer-projects.controller';
import { DeveloperProjectsService } from './developer-projects.service';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [DeveloperProjectsController],
  providers: [DeveloperProjectsService],
  exports: [DeveloperProjectsService],
})
export class DeveloperProjectsModule {}
