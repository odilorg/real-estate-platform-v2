import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAgenciesController } from './agencies/admin-agencies.controller';
import { AdminAgenciesService } from './agencies/admin-agencies.service';
import { PrismaModule } from '../../common/prisma';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, AdminAgenciesController],
  providers: [AdminService, AdminAgenciesService],
  exports: [AdminService, AdminAgenciesService],
})
export class AdminModule {}
