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

export class CreateUnitDto {
  @IsString()
  @MaxLength(50)
  unitNumber!: string;

  @IsNumber()
  @Type(() => Number)
  floor!: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  buildingBlock?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  entrance?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  bedrooms!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0.5)
  @IsOptional()
  bathrooms?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  area!: number;

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
  price!: number;

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

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  loggia?: number;
}
