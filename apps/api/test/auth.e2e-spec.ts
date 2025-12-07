import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'password123';
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('user');
          expect(response.body.user.email).toBe(testEmail);
          expect(response.body.user.firstName).toBe('John');
          expect(response.body.user.lastName).toBe('Doe');
          expect(response.body.user.role).toBe('USER');
          authToken = response.body.accessToken;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: 'anotherpassword',
          firstName: 'Jane',
          lastName: 'Smith',
        })
        .expect(409);
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should validate password length', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should require all fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'incomplete@example.com',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('user');
          expect(response.body.user.email).toBe(testEmail);
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
        })
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toBe(testEmail);
          expect(response.body.firstName).toBe('John');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/profile (PUT)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'UpdatedJohn',
          lastName: 'UpdatedDoe',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.firstName).toBe('UpdatedJohn');
          expect(response.body.lastName).toBe('UpdatedDoe');
        });
    });

    it('should not allow email update', () => {
      return request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put('/auth/profile')
        .send({
          firstName: 'Unauthorized',
        })
        .expect(401);
    });
  });

  describe('/auth/change-password (POST)', () => {
    const newPassword = 'newpassword123';

    it('should change password with valid current password', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword,
        })
        .expect(200);
    });

    it('should login with new password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        })
        .expect(200);
    });

    it('should fail with incorrect current password', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'anotherpassword123',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .send({
          currentPassword: newPassword,
          newPassword: 'anotherpassword123',
        })
        .expect(401);
    });
  });
});
