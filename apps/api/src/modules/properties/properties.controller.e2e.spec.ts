import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { PrismaService } from '../../common/prisma';
import { PropertiesModule } from './properties.module';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { PropertyType, ListingType, Currency } from '@repo/database';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

describe('Properties Authentication & Authorization (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  
  // Test users
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  
  // Test property
  let user1PropertyId: string;
  
  const validPropertyData = {
    title: 'Test Property for Auth',
    description: 'This is a detailed test description with more than 20 characters to pass validation',
    propertyType: PropertyType.APARTMENT,
    listingType: ListingType.SALE,
    price: 1000000000,
    currency: Currency.UZS,
    area: 75,
    bedrooms: 2,
    bathrooms: 1,
    floor: 5,
    totalFloors: 10,
    yearBuilt: 2020,
    address: 'Test Address Street 123',
    city: 'Tashkent',
    district: 'Yunusabad',
    latitude: 41.2995,
    longitude: 69.2401,
  };

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
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1-e2e@test.com',
        passwordHash: 'hashed',
        firstName: 'User',
        lastName: 'One',
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'user2-e2e@test.com',
        passwordHash: 'hashed',
        firstName: 'User',
        lastName: 'Two',
      },
    });
    user2Id = user2.id;

    // Generate JWT tokens
    user1Token = jwtService.sign({ sub: user1Id, email: user1.email });
    user2Token = jwtService.sign({ sub: user2Id, email: user2.email });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.property.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } },
    });
    await app.close();
  });

  describe('POST /properties - Create Property', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .send(validPropertyData)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPropertyData)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should create property with valid authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          ...validPropertyData,
          title: 'Auth Test Property with Good Description',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(user1Id);
      
      user1PropertyId = response.body.id;
    });

    it('should assign property to the correct authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          ...validPropertyData,
          title: 'User 2 Property with Description',
        })
        .expect(201);

      expect(response.body.userId).toBe(user2Id);
      expect(response.body.userId).not.toBe(user1Id);
    });

    it('should return validation errors for incomplete data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Too short',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /properties/my - Get User Properties', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/properties/my')
        .expect(401);
    });

    it('should return only current user properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/my')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // All properties should belong to user1
      response.body.forEach((property: any) => {
        expect(property.userId).toBe(user1Id);
        expect(property.userId).not.toBe(user2Id);
      });
    });

    it('should not return other users properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/my')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify none of the properties belong to user2
      const hasUser2Properties = response.body.some(
        (property: any) => property.userId === user2Id
      );
      expect(hasUser2Properties).toBe(false);
    });
  });

  describe('PUT /properties/:id - Update Property', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/properties/${user1PropertyId}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should allow owner to update their property', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/properties/${user1PropertyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated by Owner',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated by Owner');
      expect(response.body.userId).toBe(user1Id);
    });

    it('should prevent non-owner from updating property', async () => {
      await request(app.getHttpServer())
        .put(`/api/properties/${user1PropertyId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Title',
        })
        .expect(403);
    });
  });

  describe('DELETE /properties/:id - Delete Property', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/properties/${user1PropertyId}`)
        .expect(401);
    });

    it('should allow owner to delete their property', async () => {
      // Create a property to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          ...validPropertyData,
          title: 'Property To Be Deleted with Good Description',
        })
        .expect(201);

      const propertyId = createResponse.body.id;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify deleted
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property).toBeNull();
    });

    it('should prevent non-owner from deleting property', async () => {
      // Create property as user1
      const createResponse = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          ...validPropertyData,
          title: 'User 1 Property with Description',
        })
        .expect(201);

      const propertyId = createResponse.body.id;

      // Try to delete as user2
      await request(app.getHttpServer())
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // Verify NOT deleted
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property).not.toBeNull();
    });
  });

  describe('Token Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = jwtService.sign(
        { sub: user1Id, email: 'user1-e2e@test.com' },
        { expiresIn: '-1h' } // Already expired
      );

      await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(validPropertyData)
        .expect(401);
    });

    it('should reject tokens with invalid signature', async () => {
      const tamperedToken = user1Token.slice(0, -10) + 'tamperedXX';

      await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send(validPropertyData)
        .expect(401);
    });

    it('should reject tokens with modified payload', async () => {
      // Try to use user1's token but modify it
      const parts = user1Token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.sub = user2Id; // Try to impersonate user2
      const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .send(validPropertyData)
        .expect(401);
    });
  });

  describe('Regression Test: Property Ownership Bug', () => {
    it('should NEVER assign property to wrong user (regression test)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          ...validPropertyData,
          title: 'Regression Test Property Description',
        })
        .expect(201);

      // Verify property belongs to user1, not any other user
      expect(response.body.userId).toBe(user1Id);
      
      // Double-check in database
      const property = await prisma.property.findUnique({
        where: { id: response.body.id },
      });
      
      expect(property).not.toBeNull();
      expect(property!.userId).toBe(user1Id);
      expect(property!.userId).not.toBe(user2Id);
      
      // Get first user in database (the one that was getting wrong properties)
      const firstUser = await prisma.user.findFirst();
      if (firstUser && firstUser.id !== user1Id) {
        expect(property!.userId).not.toBe(firstUser.id);
      }
    });

    it('should NEVER fall back to test-user-id-temporary', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          ...validPropertyData,
          title: 'No Fallback Test Property Description',
        })
        .expect(201);

      expect(response.body.userId).not.toBe('test-user-id-temporary');
      expect(response.body.userId).toBe(user1Id);
    });
  });
});
