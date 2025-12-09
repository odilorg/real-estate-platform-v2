import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { LocationService } from './location.service';
import { PriceHistoryService } from './price-history.service';
import { POIService } from './poi.service';
import { AnalyticsService } from './analytics.service';
import { RecommendationService } from './recommendation.service';
import { StatusHistoryService } from './status-history.service';
import { ValuationService } from './valuation.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, LocationService, PriceHistoryService, POIService, AnalyticsService, RecommendationService, StatusHistoryService, ValuationService],
  exports: [PropertiesService, LocationService, PriceHistoryService, POIService, AnalyticsService, RecommendationService, StatusHistoryService, ValuationService],
})
export class PropertiesModule {}
