/**
 * Property Enum Validation E2E Tests
 *
 * These tests verify that enum validation works correctly end-to-end,
 * catching the GROUND vs STREET type bugs in production environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { cleanupDatabase, createAuthenticatedUser } from './helpers/test-utils';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Property Enum Validation (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let prisma: PrismaService;

  const validPropertyBase = {
    title: 'Test Property with Enum Values',
    description: 'Testing enum validation to prevent GROUND vs STREET bugs',
    price: 150000,
    currency: 'YE',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    address: '123 Test Street',
    city: 'Ташкент',
    latitude: 41.311081,
    longitude: 69.240562,
    area: 75.5,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const { token } = await createAuthenticatedUser(app);
    authToken = token;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('ParkingType Enum Validation', () => {
    it('should accept STREET (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'STREET' })
        .expect(201);

      expect(response.body.parkingType).toBe('STREET');
    });

    it('should accept UNDERGROUND (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'UNDERGROUND' })
        .expect(201);

      expect(response.body.parkingType).toBe('UNDERGROUND');
    });

    it('should accept GARAGE (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'GARAGE' })
        .expect(201);

      expect(response.body.parkingType).toBe('GARAGE');
    });

    it('should accept MULTI_LEVEL (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'MULTI_LEVEL' })
        .expect(201);

      expect(response.body.parkingType).toBe('MULTI_LEVEL');
    });

    it('should reject GROUND (deprecated value) - THIS IS OUR BUG!', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'GROUND' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject MULTILEVEL (wrong format)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'MULTILEVEL' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject OPEN (deprecated value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'OPEN' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Renovation Enum Validation', () => {
    it('should accept NONE (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'NONE' })
        .expect(201);

      expect(response.body.renovation).toBe('NONE');
    });

    it('should accept COSMETIC (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'COSMETIC' })
        .expect(201);

      expect(response.body.renovation).toBe('COSMETIC');
    });

    it('should accept EURO (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'EURO' })
        .expect(201);

      expect(response.body.renovation).toBe('EURO');
    });

    it('should accept DESIGNER (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'DESIGNER' })
        .expect(201);

      expect(response.body.renovation).toBe('DESIGNER');
    });

    it('should accept NEEDS_REPAIR (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'NEEDS_REPAIR' })
        .expect(201);

      expect(response.body.renovation).toBe('NEEDS_REPAIR');
    });

    it('should reject DESIGN (deprecated value) - THIS IS OUR BUG!', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'DESIGN' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject NO_RENOVATION (deprecated value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'NO_RENOVATION' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject NEEDS_RENOVATION (deprecated value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'NEEDS_RENOVATION' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Currency Enum Validation', () => {
    it('should accept YE (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, currency: 'YE' })
        .expect(201);

      expect(response.body.currency).toBe('YE');
    });

    it('should accept UZS (valid value)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, currency: 'UZS' })
        .expect(201);

      expect(response.body.currency).toBe('UZS');
    });

    it('should reject USD (removed currency)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, currency: 'USD' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Multiple Enum Fields Together', () => {
    it('should accept property with all valid enum values', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validPropertyBase,
          parkingType: 'UNDERGROUND',
          renovation: 'DESIGNER',
          currency: 'YE',
          bathroomType: 'SEPARATE',
          windowView: 'STREET',
          furnished: 'YES',
        })
        .expect(201);

      expect(response.body.parkingType).toBe('UNDERGROUND');
      expect(response.body.renovation).toBe('DESIGNER');
      expect(response.body.currency).toBe('YE');
      expect(response.body.bathroomType).toBe('SEPARATE');
      expect(response.body.windowView).toBe('STREET');
      expect(response.body.furnished).toBe('YES');
    });

    it('should reject property with one invalid enum value', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validPropertyBase,
          parkingType: 'UNDERGROUND', // valid
          renovation: 'DESIGN', // INVALID - should be DESIGNER
          currency: 'YE', // valid
        })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Empty String Handling', () => {
    it('should handle undefined optional enum fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validPropertyBase,
          parkingType: undefined,
          renovation: undefined,
          bathroomType: undefined,
        })
        .expect(201);

      expect(response.body.parkingType).toBeNull();
      expect(response.body.renovation).toBeNull();
      expect(response.body.bathroomType).toBeNull();
    });
  });

  describe('Case Sensitivity', () => {
    it('should reject lowercase enum values', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, parkingType: 'street' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject mixed case enum values', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validPropertyBase, renovation: 'Designer' })
        .expect(400);

      expect(response.body.message).toContain('Validation failed');
    });
  });
});
