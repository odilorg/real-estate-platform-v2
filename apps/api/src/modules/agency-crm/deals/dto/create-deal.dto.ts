import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsDateString, IsObject } from 'class-validator';

export enum DealType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH = 'BOTH',
}

export enum DealStage {
  QUALIFIED = 'QUALIFIED',
  VIEWING_SCHEDULED = 'VIEWING_SCHEDULED',
  VIEWING_COMPLETED = 'VIEWING_COMPLETED',
  OFFER_MADE = 'OFFER_MADE',
  NEGOTIATION = 'NEGOTIATION',
  AGREEMENT_REACHED = 'AGREEMENT_REACHED',
  NOTARY_SCHEDULED = 'NOTARY_SCHEDULED',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  REGISTRATION_PENDING = 'REGISTRATION_PENDING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum DealStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  WON = 'WON',
  LOST = 'LOST',
}

export enum Currency {
  UZS = 'UZS',
  YE = 'YE', // у.е. (y.e. - Uzbek unit)
}

export class CreateDealDto {
  @IsString()
  leadId!: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsEnum(DealType)
  dealType!: DealType;

  @IsNumber()
  @Min(0)
  dealValue!: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsEnum(DealStatus)
  @IsOptional()
  status?: DealStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsString()
  ownerId!: string; // Agent responsible

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number; // Default will be from agency settings

  @IsObject()
  @IsOptional()
  commissionSplit?: any; // JSON: [{ memberId: string, percent: number }]

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDealDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsEnum(DealType)
  @IsOptional()
  dealType?: DealType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dealValue?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsEnum(DealStatus)
  @IsOptional()
  status?: DealStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsDateString()
  @IsOptional()
  actualCloseDate?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  commissionAmount?: number;

  @IsObject()
  @IsOptional()
  commissionSplit?: any;

  @IsDateString()
  @IsOptional()
  notaryScheduled?: string;

  @IsOptional()
  notaryCompleted?: boolean;

  @IsString()
  @IsOptional()
  registrationId?: string;

  @IsDateString()
  @IsOptional()
  registrationDate?: string;

  @IsString()
  @IsOptional()
  closeReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseDealDto {
  @IsEnum(DealStatus)
  status!: 'WON' | 'LOST'; // Only allow WON or LOST

  @IsString()
  @IsOptional()
  closeReason?: string; // Required if LOST

  @IsDateString()
  @IsOptional()
  actualCloseDate?: string; // Defaults to now if not provided
}
