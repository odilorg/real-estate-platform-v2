import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';

// Lead management
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';

// Member management
import { MembersController } from './members/members.controller';
import { MembersService } from './members/members.service';

// Deal pipeline
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';

// Commission tracking
import { CommissionsController } from './commissions/commissions.controller';
import { CommissionsService } from './commissions/commissions.service';

// Activity logs
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';

// Task management
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

// Analytics & reporting
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';

// Listing management
import { ListingsController } from './listings/listings.controller';
import { ListingsService } from './listings/listings.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    LeadsController,
    MembersController,
    DealsController,
    CommissionsController,
    ActivitiesController,
    TasksController,
    AnalyticsController,
    ListingsController,
  ],
  providers: [
    LeadsService,
    MembersService,
    DealsService,
    CommissionsService,
    ActivitiesService,
    TasksService,
    AnalyticsService,
    ListingsService,
  ],
  exports: [
    LeadsService,
    MembersService,
    DealsService,
    CommissionsService,
    ActivitiesService,
    TasksService,
    AnalyticsService,
    ListingsService,
  ],
})
export class AgencyCrmModule {}
