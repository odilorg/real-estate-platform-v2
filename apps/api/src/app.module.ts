import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ViewingsModule } from './modules/viewings/viewings.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { DevelopersModule } from './modules/developers/developers.module';
import { DeveloperProjectsModule } from './modules/developer-projects/developer-projects.module';
import { UnitsModule } from './modules/units/units.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MediaModule } from './modules/media/media.module';
import { EmailModule } from './modules/email/email.module';
import { SearchModule } from './modules/search/search.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Enable scheduled tasks
    ScheduleModule.forRoot(),
    // Rate limiting - 60 requests per minute by default
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    PrismaModule,
    AuthModule,
    UploadModule,
    PropertiesModule,
    FavoritesModule,
    MessagesModule,
    ViewingsModule,
    AdminModule,
    ReviewsModule,
    SavedSearchesModule,
    AgentsModule,
    AgenciesModule,
    DevelopersModule,
    DeveloperProjectsModule,
    UnitsModule,
    LeadsModule,
    MediaModule,
    EmailModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT auth guard (use @Public() decorator for public endpoints)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
