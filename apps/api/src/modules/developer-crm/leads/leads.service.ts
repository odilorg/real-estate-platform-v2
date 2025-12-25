import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { ImportLeadsDto, ImportLeadRow, ImportResult } from './dto/import-leads.dto';
import { LeadSource, PropertyType, ListingType } from '@repo/database';
import { BulkDeleteDto, BulkAssignDto, BulkOperationResult } from './dto/bulk-operations.dto';
import * as Papa from 'papaparse';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(developerId: string, createLeadDto: CreateLeadDto) {
    return this.prisma.developerLead.create({
      data: {
        developerId,
        ...createLeadDto,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(developerId: string, query: QueryLeadsDto) {
    const { status, assignedToId, source, priority, search, skip = 0, take = 20 } = query;

    // Build where clause
    const where: any = { developerId };

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (source) where.source = source;
    if (priority) where.priority = priority;

    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.developerLead.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'asc' }, // URGENT first
          { createdAt: 'desc' }, // Newest first
        ],
        include: {
          assignedTo: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.developerLead.count({ where }),
    ]);

    return {
      leads,
      total,
      skip,
      take,
    };
  }

  async findOne(developerId: string, id: string): Promise<any> {
    const lead = await this.prisma.developerLead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            member: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          where: {
            status: { not: 'COMPLETED' },
          },
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException();
    }

    // Security: verify lead belongs to this agency
    if (lead.developerId !== developerId) {
      throw new ForbiddenException('Access denied');
    }

    return lead;
  }

  async update(developerId: string, id: string, updateLeadDto: UpdateLeadDto) {
    // Verify ownership
    await this.findOne(developerId, id);

    return this.prisma.developerLead.update({
      where: { id },
      data: updateLeadDto,
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(developerId: string, id: string) {
    // Verify ownership
    await this.findOne(developerId, id);

    return this.prisma.developerLead.delete({
      where: { id },
    });
  }

  async assign(developerId: string, leadId: string, memberId: string) {
    // Verify ownership
    await this.findOne(developerId, leadId);

    // Verify member belongs to this agency
    const member = await this.prisma.developerMember.findFirst({
      where: {
        id: memberId,
        developerId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException();
    }

    return this.prisma.developerLead.update({
      where: { id: leadId },
      data: {
        assignedToId: memberId,
        assignedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async importFromCSV(developerId: string, importDto: ImportLeadsDto): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      imported: [],
    };

    try {
      // Parse CSV
      const parsed = Papa.parse<ImportLeadRow>(importDto.csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
      });

      if (parsed.errors.length > 0) {
        throw new BadRequestException(`CSV parsing error: ${parsed.errors[0].message}`);
      }

      const rows = parsed.data;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because of header and 0-indexing

        try {
          // Validate required fields
          if (!row.firstname || !row.lastname || !row.phone) {
            result.errors.push({
              row: rowNumber,
              data: row,
              error: 'Missing required fields (firstName, lastName, phone)',
            });
            result.failed++;
            continue;
          }

          // Check for duplicate phone number
          const existing = await this.prisma.developerLead.findFirst({
            where: {
              developerId,
              phone: row.phone,
            },
          });

          if (existing) {
            if (importDto.duplicateHandling === 'skip') {
              result.skipped++;
              continue;
            } else if (importDto.duplicateHandling === 'error') {
              result.errors.push({
                row: rowNumber,
                data: row,
                error: `Duplicate phone number: ${row.phone}`,
              });
              result.failed++;
              continue;
            } else if (importDto.duplicateHandling === 'update') {
              // Update existing lead
              const updated = await this.prisma.developerLead.update({
                where: { id: existing.id },
                data: {
                  firstName: row.firstname || existing.firstName,
                  lastName: row.lastname || existing.lastName,
                  email: row.email || existing.email,
                  telegram: row.telegram || existing.telegram,
                  whatsapp: row.whatsapp || existing.whatsapp,
                  propertyType: (row.propertytype as PropertyType) || existing.propertyType,
                  listingType: (row.listingtype as ListingType) || existing.listingType,
                  budget: row.budget ? parseFloat(row.budget.toString()) : existing.budget,
                  bedrooms: row.bedrooms ? parseInt(row.bedrooms.toString()) : existing.bedrooms,
                  districts: row.districts ? row.districts.split(',').map((d: string) => d.trim()) : existing.districts,
                  requirements: row.requirements || existing.requirements,
                  source: (row.source as LeadSource) || existing.source || LeadSource.OTHER,
                  status: (row.status as any) || existing.status,
                  priority: (row.priority as any) || existing.priority,
                  notes: row.notes || existing.notes,
                },
              });
              result.success++;
              result.imported.push(updated);
              continue;
            }
          }

          // Create new lead
          const created = await this.prisma.developerLead.create({
            data: {
              developerId,
              firstName: row.firstname,
              lastName: row.lastname,
              phone: row.phone,
              email: row.email,
              telegram: row.telegram,
              whatsapp: row.whatsapp,
              propertyType: row.propertytype as PropertyType | null,
              listingType: row.listingtype as ListingType | null,
              budget: row.budget ? parseFloat(row.budget.toString()) : null,
              bedrooms: row.bedrooms ? parseInt(row.bedrooms.toString()) : null,
              districts: row.districts ? row.districts.split(',').map((d: string) => d.trim()) : [],
              requirements: row.requirements,
              source: (row.source as LeadSource) || LeadSource.OTHER,
              status: (row.status as any) || 'NEW',
              priority: (row.priority as any) || 'MEDIUM',
              notes: row.notes,
              assignedToId: importDto.defaultAssignedTo || null,
              assignedAt: importDto.defaultAssignedTo ? new Date() : null,
            },
          });

          result.success++;
          result.imported.push(created);
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: error?.message || 'Unknown error',
          });
          result.failed++;
        }
      }

      return result;
    } catch (error: any) {
      throw new BadRequestException(`Import failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async exportToCSV(developerId: string, query: QueryLeadsDto): Promise<{ csv: string; filename: string }> {
    // Get leads based on query filters
    const { leads } = await this.findAll(developerId, query);

    // Prepare data for CSV export
    const csvData = leads.map((lead) => ({
      FirstName: lead.firstName,
      LastName: lead.lastName,
      Phone: lead.phone,
      Email: lead.email || '',
      Telegram: lead.telegram || '',
      WhatsApp: lead.whatsapp || '',
      PropertyType: lead.propertyType || '',
      ListingType: lead.listingType || '',
      Budget: lead.budget || '',
      Bedrooms: lead.bedrooms || '',
      Districts: Array.isArray(lead.districts) ? lead.districts.join(', ') : '',
      Requirements: lead.requirements || '',
      Source: lead.source,
      Status: lead.status,
      Priority: lead.priority,
      AssignedTo: lead.assignedTo ? `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}` : '',
      Notes: lead.notes || '',
      CreatedAt: new Date(lead.createdAt).toISOString(),
    }));

    // Convert to CSV using PapaParse
    const csv = Papa.unparse(csvData);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads-export-${timestamp}.csv`;

    return { csv, filename };
  }

  async bulkDelete(developerId: string, bulkDeleteDto: BulkDeleteDto): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const leadId of bulkDeleteDto.leadIds) {
      try {
        // Verify ownership before deleting
        const lead = await this.prisma.developerLead.findUnique({
          where: { id: leadId },
        });

        if (!lead) {
          result.errors.push({
            leadId,
            error: 'Lead not found',
          });
          result.failed++;
          continue;
        }

        if (lead.developerId !== developerId) {
          result.errors.push({
            leadId,
            error: 'Access denied',
          });
          result.failed++;
          continue;
        }

        await this.prisma.developerLead.delete({
          where: { id: leadId },
        });

        result.success++;
      } catch (error: any) {
        result.errors.push({
          leadId,
          error: error?.message || 'Unknown error',
        });
        result.failed++;
      }
    }

    return result;
  }

  async bulkAssign(developerId: string, bulkAssignDto: BulkAssignDto): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Verify member belongs to this agency
    const member = await this.prisma.developerMember.findFirst({
      where: {
        id: bulkAssignDto.memberId,
        developerId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found or not active');
    }

    for (const leadId of bulkAssignDto.leadIds) {
      try {
        // Verify ownership before assigning
        const lead = await this.prisma.developerLead.findUnique({
          where: { id: leadId },
        });

        if (!lead) {
          result.errors.push({
            leadId,
            error: 'Lead not found',
          });
          result.failed++;
          continue;
        }

        if (lead.developerId !== developerId) {
          result.errors.push({
            leadId,
            error: 'Access denied',
          });
          result.failed++;
          continue;
        }

        await this.prisma.developerLead.update({
          where: { id: leadId },
          data: {
            assignedToId: bulkAssignDto.memberId,
            assignedAt: new Date(),
          },
        });

        result.success++;
      } catch (error: any) {
        result.errors.push({
          leadId,
          error: error?.message || 'Unknown error',
        });
        result.failed++;
      }
    }

    return result;
  }
}
