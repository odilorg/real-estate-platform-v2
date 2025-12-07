import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { LocationService } from './location.service';
import { PriceHistoryService } from './price-history.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, LocationService, PriceHistoryService],
  exports: [PropertiesService, LocationService, PriceHistoryService],
})
export class PropertiesModule {}
