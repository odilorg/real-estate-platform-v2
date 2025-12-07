import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Properties (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
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
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/properties (POST)', () => {
    it('should create a new property', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Luxury Apartment',
          description: 'Beautiful apartment in city center',
          price: 150000,
          currency: 'YE',
          propertyType: 'APARTMENT',
          listingType: 'SALE',
          address: '123 Main St',
          city: 'Tashkent',
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          amenities: ['Parking', 'Gym', 'Pool'],
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe('Test Luxury Apartment');
          expect(response.body.price).toBe(150000);
          propertyId = response.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send({
          title: 'Unauthorized Property',
          price: 100000,
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Property',
        })
        .expect(400);
    });
  });

  describe('/properties (GET)', () => {
    it('should return list of properties', () => {
      return request(app.getHttpServer())
        .get('/properties')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('should filter by city', () => {
      return request(app.getHttpServer())
        .get('/properties?city=Tashkent')
        .expect(200)
        .then((response) => {
          response.body.data.forEach((property: any) => {
            expect(property.city.toLowerCase()).toContain('tashkent'.toLowerCase());
          });
        });
    });

    it('should filter by property type', () => {
      return request(app.getHttpServer())
        .get('/properties?propertyType=APARTMENT')
        .expect(200)
        .then((response) => {
          response.body.data.forEach((property: any) => {
            expect(property.propertyType).toBe('APARTMENT');
          });
        });
    });

    it('should filter by price range', () => {
      return request(app.getHttpServer())
        .get('/properties?minPrice=50000&maxPrice=200000')
        .expect(200)
        .then((response) => {
          response.body.data.forEach((property: any) => {
            expect(property.price).toBeGreaterThanOrEqual(50000);
            expect(property.price).toBeLessThanOrEqual(200000);
          });
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/properties?page=1&limit=10')
        .expect(200)
        .then((response) => {
          expect(response.body.page).toBe(1);
          expect(response.body.limit).toBe(10);
          expect(response.body.data.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('/properties/:id (GET)', () => {
    it('should return property by id', () => {
      return request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(propertyId);
          expect(response.body.title).toBe('Test Luxury Apartment');
        });
    });

    it('should increment view count', async () => {
      const firstView = await request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .expect(200);

      const secondView = await request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .expect(200);

      expect(secondView.body.views).toBeGreaterThan(firstView.body.views);
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .get('/properties/nonexistent-id')
        .expect(404);
    });
  });

  describe('/properties/:id (PUT)', () => {
    it('should update own property', () => {
      return request(app.getHttpServer())
        .put(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Luxury Apartment',
          price: 160000,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe('Updated Luxury Apartment');
          expect(response.body.price).toBe(160000);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/properties/${propertyId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
    });
  });

  describe('/properties/:id (DELETE)', () => {
    it('should delete own property', () => {
      return request(app.getHttpServer())
        .delete(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for already deleted property', () => {
      return request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .expect(404);
    });
  });
});
