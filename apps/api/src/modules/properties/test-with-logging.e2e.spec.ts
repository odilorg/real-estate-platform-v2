import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { PropertiesModule } from './properties.module';
import { AuthModule } from '../auth/auth.module';
import { PropertyType, ListingType, Currency } from '@repo/database';
import { PrismaService } from '../../common/prisma';

describe('Test With Logging', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PropertiesModule,
        AuthModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    // Enable detailed error logging
    app.useLogger(new Logger());
    
    await app.init();
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should show detailed error', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/properties')
      .send({
        title: 'Test Property',
        description: 'Test description with enough characters',
        propertyType: PropertyType.APARTMENT,
        listingType: ListingType.SALE,
        price: 1000000,
        currency: Currency.UZS,
        address: 'Test Address',
        city: 'Tashkent',
      });

    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));
  });
});
