import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';
import { PropertyType, ListingType, Currency, LeadSource, LeadStatus, LeadPriority } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telegram?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  // Property Requirements
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsEnum(Currency)
  budgetCurrency?: Currency;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  districts?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirements?: string;

  // Lead Info
  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
