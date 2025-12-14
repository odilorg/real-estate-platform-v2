import { IsObject, IsOptional } from 'class-validator';

export class BulkUploadDto {
  @IsObject()
  @IsOptional()
  mapping?: {
    unitNumber?: string;
    floor?: string;
    bedrooms?: string;
    bathrooms?: string;
    area?: string;
    price?: string;
    block?: string;
    entrance?: string;
    livingArea?: string;
    kitchenArea?: string;
    currency?: string;
  };
}

export interface BulkUploadResult {
  created: number;
  failed: number;
  errors: Array<{
    row: number;
    unitNumber?: string;
    error: string;
  }>;
}
