import { Module } from '@nestjs/common';
import { ViewingsController } from './viewings.controller';
import { ViewingsService } from './viewings.service';
import { PrismaModule } from '../../common/prisma';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ViewingsController],
  providers: [ViewingsService],
  exports: [ViewingsService],
})
export class ViewingsModule {}
