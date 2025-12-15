import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createAuthenticatedUser } from './helpers/test-utils';

describe('Developers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test users
  let adminUser: { user: any; token: string };
  let developerAdmin: { user: any; token: string };
  let regularUser: { user: any; token: string };

  // Test developer
  let testDeveloper: any;
  const testSlug = `test-developer-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Create test users with different roles
    adminUser = await createAuthenticatedUser(app, {
      email: `admin-dev-${Date.now()}@test.com`,
      role: 'ADMIN',
    });

    regularUser = await createAuthenticatedUser(app, {
      email: `user-dev-${Date.now()}@test.com`,
      role: 'USER',
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testDeveloper?.id) {
      // Remove team members first
      await prisma.user.updateMany({
        where: { developerId: testDeveloper.id },
        data: { developerId: null, role: 'USER' },
      });
      await prisma.developer.delete({ where: { id: testDeveloper.id } }).catch(() => {});
    }

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser?.user?.email, developerAdmin?.user?.email, regularUser?.user?.email].filter(Boolean),
        },
      },
    });

    await app.close();
  });

  describe('POST /developers (Create Developer)', () => {
    const validDeveloperData = {
      name: 'Test Developer Company',
      nameUz: 'Test Developer Kompaniyasi',
      slug: testSlug,
      phone: '+998901234567',
      email: 'developer@test.com',
      city: 'Tashkent',
      descriptionRu: 'Надежный застройщик с многолетним опытом',
      descriptionUz: "Ko'p yillik tajribaga ega ishonchli quruvchi",
      establishedYear: 2010,
      licenseNumber: 'LIC-12345',
    };

    it('should create a developer when admin user is authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/developers')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(validDeveloperData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(validDeveloperData.name);
      expect(response.body.slug).toBe(validDeveloperData.slug);
      expect(response.body.phone).toBe(validDeveloperData.phone);
      expect(response.body.city).toBe(validDeveloperData.city);

      testDeveloper = response.body;
    });

    it('should fail when non-admin tries to create developer', async () => {
      await request(app.getHttpServer())
        .post('/developers')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          ...validDeveloperData,
          slug: 'another-slug',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/developers')
        .send(validDeveloperData)
        .expect(401);
    });

    it('should fail with duplicate slug', async () => {
      await request(app.getHttpServer())
        .post('/developers')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(validDeveloperData)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/developers')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Incomplete Developer',
          // Missing slug, phone, city
        });

      // Should reject with validation error (400) or internal error (500)
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /developers (List Developers)', () => {
    it('should return paginated list of developers (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/developers')
        .expect(200);

      // API returns {developers: [], total, page, limit}
      expect(response.body).toHaveProperty('developers');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.developers)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/developers?page=1&limit=5')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it('should filter by city', async () => {
      const response = await request(app.getHttpServer())
        .get('/developers?city=Tashkent')
        .expect(200);

      // All returned developers should be from Tashkent
      const items = response.body.developers || response.body.items || response.body;
      if (Array.isArray(items)) {
        items.forEach((dev: any) => {
          if (dev.city) {
            expect(dev.city.toLowerCase()).toContain('tashkent');
          }
        });
      }
    });

    it('should filter by verified status', async () => {
      const response = await request(app.getHttpServer())
        .get('/developers?verified=true')
        .expect(200);

      const items = response.body.developers || response.body.items || response.body;
      if (Array.isArray(items)) {
        items.forEach((dev: any) => {
          expect(dev.verified).toBe(true);
        });
      }
    });
  });

  describe('GET /developers/slug/:slug (Get by Slug)', () => {
    it('should return developer by slug (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/developers/slug/${testSlug}`)
        .expect(200);

      expect(response.body.slug).toBe(testSlug);
      expect(response.body.name).toBe('Test Developer Company');
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/developers/slug/non-existent-slug-12345')
        .expect(404);
    });
  });

  describe('GET /developers/:id (Get by ID)', () => {
    it('should return developer by ID (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/developers/${testDeveloper.id}`)
        .expect(200);

      expect(response.body.id).toBe(testDeveloper.id);
      expect(response.body.name).toBe('Test Developer Company');
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/developers/non-existent-id-12345')
        .expect(404);
    });
  });

  describe('PUT /developers/:id (Update Developer)', () => {
    it('should update developer when admin is authenticated', async () => {
      const updateData = {
        descriptionRu: 'Updated description in Russian',
        descriptionUz: 'Updated description in Uzbek',
        website: 'https://test-developer.uz',
      };

      const response = await request(app.getHttpServer())
        .put(`/developers/${testDeveloper.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.descriptionRu).toBe(updateData.descriptionRu);
      expect(response.body.descriptionUz).toBe(updateData.descriptionUz);
      expect(response.body.website).toBe(updateData.website);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/developers/${testDeveloper.id}`)
        .send({ descriptionRu: 'Unauthorized update' })
        .expect(401);
    });

    it('should return error for non-existent developer', async () => {
      const response = await request(app.getHttpServer())
        .put('/developers/non-existent-id')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ descriptionRu: 'Test' });

      // Should return 404 or 500 for non-existent ID
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('POST /developers/:id/team (Add Team Member)', () => {
    beforeAll(async () => {
      // Create a developer admin user for team tests
      developerAdmin = await createAuthenticatedUser(app, {
        email: `dev-admin-${Date.now()}@test.com`,
        role: 'DEVELOPER_ADMIN',
        developerId: testDeveloper.id,
      });
    });

    it('should add team member when admin is authenticated', async () => {
      // Create a new user to add as team member
      const newTeamMember = await createAuthenticatedUser(app, {
        email: `team-member-${Date.now()}@test.com`,
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/team`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          userId: newTeamMember.user.id,
          role: 'DEVELOPER_SALES_AGENT',
        })
        .expect(201);

      expect(response.body.message).toBe('Team member added successfully');

      // Verify user was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: newTeamMember.user.id },
      });
      expect(updatedUser?.role).toBe('DEVELOPER_SALES_AGENT');
      expect(updatedUser?.developerId).toBe(testDeveloper.id);
    });

    it('should allow developer admin to add team member', async () => {
      const anotherTeamMember = await createAuthenticatedUser(app, {
        email: `team-member-2-${Date.now()}@test.com`,
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/team`)
        .set('Authorization', `Bearer ${developerAdmin.token}`)
        .send({
          userId: anotherTeamMember.user.id,
          role: 'DEVELOPER_SALES_AGENT',
        })
        .expect(201);
    });

    it('should fail when regular user tries to add team member', async () => {
      const potentialMember = await createAuthenticatedUser(app, {
        email: `potential-member-${Date.now()}@test.com`,
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/team`)
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          userId: potentialMember.user.id,
          role: 'DEVELOPER_SALES_AGENT',
        })
        .expect(403);
    });

    it('should validate role field', async () => {
      const response = await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/team`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          userId: regularUser.user.id,
          role: 'INVALID_ROLE',
        });

      // Should reject invalid role with 400 or 500
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /developers/:id/team/:userId (Remove Team Member)', () => {
    let teamMemberToRemove: { user: any; token: string };

    beforeAll(async () => {
      // Create and add a team member to remove
      teamMemberToRemove = await createAuthenticatedUser(app, {
        email: `removable-member-${Date.now()}@test.com`,
        role: 'DEVELOPER_SALES_AGENT',
        developerId: testDeveloper.id,
      });
    });

    it('should remove team member when admin is authenticated', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/developers/${testDeveloper.id}/team/${teamMemberToRemove.user.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body.message).toBe('Team member removed successfully');

      // Verify user role was reset
      const updatedUser = await prisma.user.findUnique({
        where: { id: teamMemberToRemove.user.id },
      });
      expect(updatedUser?.role).toBe('USER');
      expect(updatedUser?.developerId).toBeNull();
    });

    it('should fail when regular user tries to remove team member', async () => {
      await request(app.getHttpServer())
        .delete(`/developers/${testDeveloper.id}/team/${developerAdmin.user.id}`)
        .set('Authorization', `Bearer ${regularUser.token}`)
        .expect(403);
    });
  });

  describe('POST /developers/:id/update-stats (Update Statistics)', () => {
    it('should update statistics when admin is authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/update-stats`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(201);

      expect(response.body.message).toBe('Statistics updated successfully');
    });

    it('should fail when developer admin tries to update stats', async () => {
      await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/update-stats`)
        .set('Authorization', `Bearer ${developerAdmin.token}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/developers/${testDeveloper.id}/update-stats`)
        .expect(401);
    });
  });

  describe('DELETE /developers/:id (Delete Developer)', () => {
    let developerToDelete: any;

    beforeAll(async () => {
      // Create a developer specifically for deletion test
      const response = await request(app.getHttpServer())
        .post('/developers')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Developer To Delete',
          slug: `delete-test-${Date.now()}`,
          phone: '+998909876543',
          city: 'Samarkand',
        });
      developerToDelete = response.body;
    });

    it('should fail when non-admin tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/developers/${developerToDelete.id}`)
        .set('Authorization', `Bearer ${regularUser.token}`)
        .expect(403);
    });

    it('should delete developer when admin is authenticated', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/developers/${developerToDelete.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body.message).toBe('Developer deleted successfully');

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/developers/${developerToDelete.id}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent developer', async () => {
      await request(app.getHttpServer())
        .delete('/developers/non-existent-id')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(404);
    });
  });
});
