import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadSource, PropertyType, ListingType, LeadStatus, LeadPriority } from '@repo/database';

// Extended mock PrismaService with Agency CRM models
const mockPrismaService = {
  agencyLead: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  agencyMember: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('LeadsService - Advanced Features', () => {
  let service: LeadsService;
  let prisma: typeof mockPrismaService;

  const createMockLead = (overrides = {}) => ({
    id: 'lead-123',
    agencyId: 'agency-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+998901234567',
    email: 'john@example.com',
    telegram: '@johndoe',
    whatsapp: '+998901234567',
    propertyType: PropertyType.APARTMENT,
    listingType: ListingType.SALE,
    budget: 100000,
    bedrooms: 2,
    districts: ['Юнусабад', 'Мирабад'],
    requirements: 'Need apartment near metro',
    source: LeadSource.WEBSITE,
    status: 'NEW' as LeadStatus,
    priority: 'MEDIUM' as LeadPriority,
    notes: 'Contacted via phone',
    assignedToId: null,
    assignedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockMember = (overrides = {}) => ({
    id: 'member-123',
    agencyId: 'agency-123',
    userId: 'user-123',
    role: 'AGENT',
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      firstName: 'Agent',
      lastName: 'Smith',
    },
    ...overrides,
  });

  beforeEach(async () => {
    // Reset all mocks
    Object.values(mockPrismaService).forEach((service) => {
      Object.values(service).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prisma = mockPrismaService;
  });

  describe('importFromCSV', () => {
    const agencyId = 'agency-123';

    it('should import leads from CSV successfully', async () => {
      const csvData = `FirstName,LastName,Phone,Email
John,Doe,+998901111111,john@example.com
Jane,Smith,+998902222222,jane@example.com`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
      };

      prisma.agencyLead.findFirst.mockResolvedValue(null); // No duplicates
      prisma.agencyLead.create.mockResolvedValueOnce(
        createMockLead({ firstName: 'John', phone: '+998901111111' }),
      );
      prisma.agencyLead.create.mockResolvedValueOnce(
        createMockLead({ firstName: 'Jane', phone: '+998902222222' }),
      );

      const result = await service.importFromCSV(agencyId, importDto);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.imported).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip duplicate leads when duplicateHandling is "skip"', async () => {
      const csvData = `FirstName,LastName,Phone
John,Doe,+998901111111
Jane,Smith,+998901111111`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
      };

      // First lead is new, second is duplicate
      prisma.agencyLead.findFirst.mockResolvedValueOnce(null);
      prisma.agencyLead.findFirst.mockResolvedValueOnce(
        createMockLead({ phone: '+998901111111' }),
      );
      prisma.agencyLead.create.mockResolvedValue(
        createMockLead({ firstName: 'John' }),
      );

      const result = await service.importFromCSV(agencyId, importDto);

      expect(result.success).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should update duplicate leads when duplicateHandling is "update"', async () => {
      const csvData = `FirstName,LastName,Phone,Email
John,Updated,+998901111111,updated@example.com`;

      const importDto = {
        csvData,
        duplicateHandling: 'update' as const,
      };

      const existingLead = createMockLead({
        id: 'existing-lead',
        phone: '+998901111111',
        firstName: 'Old',
      });

      prisma.agencyLead.findFirst.mockResolvedValue(existingLead);
      prisma.agencyLead.update.mockResolvedValue({
        ...existingLead,
        firstName: 'John',
        lastName: 'Updated',
        email: 'updated@example.com',
      });

      const result = await service.importFromCSV(agencyId, importDto);

      expect(result.success).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(prisma.agencyLead.update).toHaveBeenCalled();
    });

    it('should report error for duplicate leads when duplicateHandling is "error"', async () => {
      const csvData = `FirstName,LastName,Phone
John,Doe,+998901111111`;

      const importDto = {
        csvData,
        duplicateHandling: 'error' as const,
      };

      prisma.agencyLead.findFirst.mockResolvedValue(
        createMockLead({ phone: '+998901111111' }),
      );

      const result = await service.importFromCSV(agencyId, importDto);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Duplicate phone number');
    });

    it('should handle missing required fields', async () => {
      const csvData = `FirstName,LastName,Phone
John,,+998901111111
,Smith,+998902222222`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
      };

      const result = await service.importFromCSV(agencyId, importDto);

      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toContain('Missing required fields');
    });

    it('should assign leads to default member if provided', async () => {
      const csvData = `FirstName,LastName,Phone
John,Doe,+998901111111`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
        defaultAssignedTo: 'member-123',
      };

      prisma.agencyLead.findFirst.mockResolvedValue(null);
      prisma.agencyLead.create.mockResolvedValue(
        createMockLead({ assignedToId: 'member-123' }),
      );

      await service.importFromCSV(agencyId, importDto);

      expect(prisma.agencyLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedToId: 'member-123',
            assignedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should parse optional fields correctly', async () => {
      const csvData = `FirstName,LastName,Phone,PropertyType,Budget,Bedrooms,Districts
John,Doe,+998901111111,APARTMENT,100000,2,"Юнусабад,Мирабад"`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
      };

      prisma.agencyLead.findFirst.mockResolvedValue(null);
      prisma.agencyLead.create.mockResolvedValue(createMockLead());

      await service.importFromCSV(agencyId, importDto);

      expect(prisma.agencyLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyType: 'APARTMENT',
            budget: 100000,
            bedrooms: 2,
            districts: expect.arrayContaining(['Юнусабад', 'Мирабад']),
          }),
        }),
      );
    });

    it('should handle CSV parsing errors', async () => {
      const importDto = {
        csvData: 'Invalid CSV\nWith\nMalformed\nData"',
        duplicateHandling: 'skip' as const,
      };

      // CSV parsing errors should throw BadRequestException
      await expect(service.importFromCSV(agencyId, importDto)).rejects.toThrow(
        'Import failed: CSV parsing error',
      );
    });

    it('should normalize CSV headers', async () => {
      const csvData = `First Name,Last Name,Phone,Source
John,Doe,+998901111111,WEBSITE`;

      const importDto = {
        csvData,
        duplicateHandling: 'skip' as const,
      };

      prisma.agencyLead.findFirst.mockResolvedValue(null);
      prisma.agencyLead.create.mockResolvedValue(createMockLead());

      const result = await service.importFromCSV(agencyId, importDto);

      // Headers should be normalized (spaces removed, lowercase)
      // "First Name" -> "firstname", "Last Name" -> "lastname"
      expect(result.success).toBe(1);
    });
  });

  describe('exportToCSV', () => {
    const agencyId = 'agency-123';

    it('should export leads to CSV format', async () => {
      const mockLeads = [
        createMockLead({
          firstName: 'John',
          lastName: 'Doe',
          phone: '+998901111111',
          assignedTo: {
            user: {
              firstName: 'Agent',
              lastName: 'Smith',
            },
          },
        }),
        createMockLead({
          id: 'lead-2',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+998902222222',
        }),
      ];

      prisma.agencyLead.findMany.mockResolvedValue(mockLeads);
      prisma.agencyLead.count.mockResolvedValue(2);

      const result = await service.exportToCSV(agencyId, {});

      expect(result.csv).toBeDefined();
      expect(result.filename).toMatch(/leads-export-\d{4}-\d{2}-\d{2}\.csv/);
      expect(result.csv).toContain('FirstName');
      expect(result.csv).toContain('LastName');
      expect(result.csv).toContain('Phone');
      expect(result.csv).toContain('John');
      expect(result.csv).toContain('Jane');
    });

    it('should include all lead fields in export', async () => {
      const mockLead = createMockLead({
        email: 'john@example.com',
        telegram: '@johndoe',
        whatsapp: '+998901234567',
        propertyType: PropertyType.APARTMENT,
        listingType: ListingType.SALE,
        budget: 100000,
        bedrooms: 2,
        districts: ['Юнусабад'],
        requirements: 'Near metro',
        source: LeadSource.WEBSITE,
        status: 'NEW' as LeadStatus,
        priority: 'HIGH' as LeadPriority,
        notes: 'Test note',
      });

      prisma.agencyLead.findMany.mockResolvedValue([mockLead]);
      prisma.agencyLead.count.mockResolvedValue(1);

      const result = await service.exportToCSV(agencyId, {});

      expect(result.csv).toContain('Email');
      expect(result.csv).toContain('Telegram');
      expect(result.csv).toContain('WhatsApp');
      expect(result.csv).toContain('PropertyType');
      expect(result.csv).toContain('Budget');
      expect(result.csv).toContain('Districts');
    });

    it('should apply query filters before exporting', async () => {
      const queryDto = {
        status: 'NEW' as LeadStatus,
        priority: 'HIGH' as LeadPriority,
      };

      prisma.agencyLead.findMany.mockResolvedValue([]);
      prisma.agencyLead.count.mockResolvedValue(0);

      await service.exportToCSV(agencyId, queryDto);

      expect(prisma.agencyLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'NEW',
            priority: 'HIGH',
          }),
        }),
      );
    });

    it('should handle empty districts array', async () => {
      const mockLead = createMockLead({ districts: [] });

      prisma.agencyLead.findMany.mockResolvedValue([mockLead]);
      prisma.agencyLead.count.mockResolvedValue(1);

      const result = await service.exportToCSV(agencyId, {});

      expect(result.csv).toBeDefined();
      // Should not throw error with empty array
    });

    it('should format assignedTo name correctly', async () => {
      const mockLead = createMockLead({
        assignedTo: {
          user: {
            firstName: 'Agent',
            lastName: 'Smith',
          },
        },
      });

      prisma.agencyLead.findMany.mockResolvedValue([mockLead]);
      prisma.agencyLead.count.mockResolvedValue(1);

      const result = await service.exportToCSV(agencyId, {});

      expect(result.csv).toContain('Agent Smith');
    });
  });

  describe('bulkDelete', () => {
    const agencyId = 'agency-123';

    it('should delete multiple leads successfully', async () => {
      const leadIds = ['lead-1', 'lead-2', 'lead-3'];
      const bulkDeleteDto = { leadIds };

      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        return Promise.resolve(createMockLead({ id: where.id, agencyId }));
      });
      prisma.agencyLead.delete.mockResolvedValue(createMockLead());

      const result = await service.bulkDelete(agencyId, bulkDeleteDto);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.agencyLead.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle non-existent leads', async () => {
      const bulkDeleteDto = { leadIds: ['lead-1', 'non-existent'] };

      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-1') {
          return Promise.resolve(createMockLead({ id: 'lead-1', agencyId }));
        }
        return Promise.resolve(null);
      });
      prisma.agencyLead.delete.mockResolvedValue(createMockLead());

      const result = await service.bulkDelete(agencyId, bulkDeleteDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Lead not found');
    });

    it('should prevent deleting leads from different agency', async () => {
      const bulkDeleteDto = { leadIds: ['lead-1', 'lead-2'] };

      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-1') {
          return Promise.resolve(createMockLead({ id: 'lead-1', agencyId }));
        }
        return Promise.resolve(
          createMockLead({ id: 'lead-2', agencyId: 'different-agency' }),
        );
      });
      prisma.agencyLead.delete.mockResolvedValue(createMockLead());

      const result = await service.bulkDelete(agencyId, bulkDeleteDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Access denied');
      expect(result.errors[0].leadId).toBe('lead-2');
    });

    it('should continue deleting even if some fail', async () => {
      const bulkDeleteDto = { leadIds: ['lead-1', 'lead-2', 'lead-3'] };

      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-2') {
          return Promise.resolve(null); // This one fails
        }
        return Promise.resolve(createMockLead({ id: where.id, agencyId }));
      });
      prisma.agencyLead.delete.mockResolvedValue(createMockLead());

      const result = await service.bulkDelete(agencyId, bulkDeleteDto);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      const bulkDeleteDto = { leadIds: ['lead-1'] };

      prisma.agencyLead.findUnique.mockResolvedValue(
        createMockLead({ id: 'lead-1', agencyId }),
      );
      prisma.agencyLead.delete.mockRejectedValue(new Error('Database error'));

      const result = await service.bulkDelete(agencyId, bulkDeleteDto);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Database error');
    });
  });

  describe('bulkAssign', () => {
    const agencyId = 'agency-123';
    const memberId = 'member-123';

    it('should assign multiple leads successfully', async () => {
      const leadIds = ['lead-1', 'lead-2', 'lead-3'];
      const bulkAssignDto = { leadIds, memberId };

      const mockMember = createMockMember({ id: memberId, agencyId });

      prisma.agencyMember.findFirst.mockResolvedValue(mockMember);
      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        return Promise.resolve(createMockLead({ id: where.id, agencyId }));
      });
      prisma.agencyLead.update.mockResolvedValue(createMockLead());

      const result = await service.bulkAssign(agencyId, bulkAssignDto);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.agencyLead.update).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException if member does not exist', async () => {
      const bulkAssignDto = { leadIds: ['lead-1'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(null);

      await expect(service.bulkAssign(agencyId, bulkAssignDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.bulkAssign(agencyId, bulkAssignDto)).rejects.toThrow(
        'Team member not found or not active',
      );
    });

    it('should throw NotFoundException if member is not active', async () => {
      const bulkAssignDto = { leadIds: ['lead-1'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(null); // isActive: false filtered out

      await expect(service.bulkAssign(agencyId, bulkAssignDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle non-existent leads', async () => {
      const bulkAssignDto = { leadIds: ['lead-1', 'non-existent'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(
        createMockMember({ id: memberId, agencyId }),
      );
      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-1') {
          return Promise.resolve(createMockLead({ id: 'lead-1', agencyId }));
        }
        return Promise.resolve(null);
      });
      prisma.agencyLead.update.mockResolvedValue(createMockLead());

      const result = await service.bulkAssign(agencyId, bulkAssignDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Lead not found');
    });

    it('should prevent assigning leads from different agency', async () => {
      const bulkAssignDto = { leadIds: ['lead-1', 'lead-2'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(
        createMockMember({ id: memberId, agencyId }),
      );
      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-1') {
          return Promise.resolve(createMockLead({ id: 'lead-1', agencyId }));
        }
        return Promise.resolve(
          createMockLead({ id: 'lead-2', agencyId: 'different-agency' }),
        );
      });
      prisma.agencyLead.update.mockResolvedValue(createMockLead());

      const result = await service.bulkAssign(agencyId, bulkAssignDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Access denied');
    });

    it('should set assignedAt timestamp when assigning', async () => {
      const bulkAssignDto = { leadIds: ['lead-1'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(
        createMockMember({ id: memberId, agencyId }),
      );
      prisma.agencyLead.findUnique.mockResolvedValue(
        createMockLead({ id: 'lead-1', agencyId }),
      );
      prisma.agencyLead.update.mockResolvedValue(createMockLead());

      await service.bulkAssign(agencyId, bulkAssignDto);

      expect(prisma.agencyLead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: {
          assignedToId: memberId,
          assignedAt: expect.any(Date),
        },
      });
    });

    it('should continue assigning even if some fail', async () => {
      const bulkAssignDto = { leadIds: ['lead-1', 'lead-2', 'lead-3'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(
        createMockMember({ id: memberId, agencyId }),
      );
      prisma.agencyLead.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'lead-2') {
          return Promise.resolve(null); // This one fails
        }
        return Promise.resolve(createMockLead({ id: where.id, agencyId }));
      });
      prisma.agencyLead.update.mockResolvedValue(createMockLead());

      const result = await service.bulkAssign(agencyId, bulkAssignDto);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should verify member belongs to agency before processing', async () => {
      const bulkAssignDto = { leadIds: ['lead-1'], memberId };

      prisma.agencyMember.findFirst.mockResolvedValue(
        createMockMember({ id: memberId, agencyId }),
      );

      await service.bulkAssign(agencyId, bulkAssignDto);

      expect(prisma.agencyMember.findFirst).toHaveBeenCalledWith({
        where: {
          id: memberId,
          agencyId,
          isActive: true,
        },
      });
    });
  });
});
