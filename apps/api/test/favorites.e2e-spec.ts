import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Favorites (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let propertyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Register a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test-favorites-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = registerResponse.body.accessToken;

    // Create a test property
    const propertyResponse = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Property for Favorites',
        description: 'Test property',
        price: 100000,
        currency: 'YE',
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        address: '123 Test St',
        city: 'Tashkent',
      });

    propertyId = propertyResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/favorites (POST)', () => {
    it('should add property to favorites', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ propertyId })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.propertyId).toBe(propertyId);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .send({ propertyId })
        .expect(401);
    });

    it('should fail with non-existent property', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ propertyId: 'nonexistent-id' })
        .expect(404);
    });

    it('should fail when already favorited', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ propertyId })
        .expect(409);
    });
  });

  describe('/favorites (GET)', () => {
    it('should return user favorites', () => {
      return request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBeGreaterThan(0);
          expect(response.body.data[0]).toHaveProperty('property');
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/favorites?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.page).toBe(1);
          expect(response.body.limit).toBe(10);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/favorites')
        .expect(401);
    });
  });

  describe('/favorites/:propertyId (DELETE)', () => {
    it('should remove property from favorites', () => {
      return request(app.getHttpServer())
        .delete(`/favorites/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/favorites/${propertyId}`)
        .expect(401);
    });

    it('should fail when property not in favorites', () => {
      return request(app.getHttpServer())
        .delete(`/favorites/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/favorites/:propertyId/check (GET)', () => {
    beforeAll(async () => {
      // Add property back to favorites for this test
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ propertyId });
    });

    it('should return true if property is favorited', () => {
      return request(app.getHttpServer())
        .get(`/favorites/${propertyId}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.isFavorited).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/favorites/${propertyId}/check`)
        .expect(401);
    });
  });
});
