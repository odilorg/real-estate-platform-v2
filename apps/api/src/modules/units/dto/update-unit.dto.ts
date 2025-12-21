import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUnitDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  unitNumber?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  floor?: number;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  buildingBlock?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  entrance?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  bedrooms?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0.5)
  @IsOptional()
  bathrooms?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  area?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  livingArea?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  kitchenArea?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  price?: number;

  @IsEnum(['YE', 'UZS'])
  @IsOptional()
  currency?: 'YE' | 'UZS';

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  paymentPlanAvailable?: boolean;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  downPaymentPercent?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  installmentMonths?: number;

  @IsString()
  @IsOptional()
  paymentPlanDetails?: string;

  @IsString()
  @IsOptional()
  renovation?: string;

  @IsString()
  @IsOptional()
  windowView?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  balcony?: number;
}
