import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';

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

<<<<<<< HEAD
// Listings management
import { ListingsController } from './listings/listings.controller';
import { ListingsService } from './listings/listings.service';

// Notifications
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';

=======
// Analytics & reporting
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';

// Listing management
import { ListingsController } from './listings/listings.controller';
import { ListingsService } from './listings/listings.service';

>>>>>>> origin/feature/agency-crm
@Module({
  imports: [PrismaModule, forwardRef(() => EmailModule), SmsModule],
  controllers: [
    LeadsController,
    MembersController,
    DealsController,
    CommissionsController,
    ActivitiesController,
    TasksController,
<<<<<<< HEAD
    ListingsController,
    NotificationsController,
=======
    AnalyticsController,
    ListingsController,
>>>>>>> origin/feature/agency-crm
  ],
  providers: [
    LeadsService,
    MembersService,
    DealsService,
    CommissionsService,
    ActivitiesService,
    TasksService,
<<<<<<< HEAD
    ListingsService,
    NotificationsService,
=======
    AnalyticsService,
    ListingsService,
>>>>>>> origin/feature/agency-crm
  ],
  exports: [
    LeadsService,
    MembersService,
    DealsService,
    CommissionsService,
    ActivitiesService,
    TasksService,
<<<<<<< HEAD
    ListingsService,
    NotificationsService,
=======
    AnalyticsService,
    ListingsService,
>>>>>>> origin/feature/agency-crm
  ],
})
export class AgencyCrmModule {}
