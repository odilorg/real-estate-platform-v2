import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { PropertiesModule } from './properties.module';
import { AuthModule } from '../auth/auth.module';
import { PropertyType, ListingType, Currency } from '@repo/database';

describe('Test WITHOUT Exception Filter', () => {
  let app: INestApplication;

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
    // NO exception filter here
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without auth', async () => {
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
    
    expect(response.status).toBe(401);
  });
});
