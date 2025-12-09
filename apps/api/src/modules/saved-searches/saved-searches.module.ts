import { Module } from '@nestjs/common';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchNotificationsService } from './notifications.service';
import { PrismaModule } from '../../common/prisma';
import { EmailModule } from '../email/email.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PrismaModule, EmailModule, PropertiesModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, SavedSearchNotificationsService],
  exports: [SavedSearchesService, SavedSearchNotificationsService],
})
export class SavedSearchesModule {}
