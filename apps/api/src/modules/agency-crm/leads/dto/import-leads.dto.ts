import { IsString, IsOptional, IsEnum } from 'class-validator';

export class ImportLeadsDto {
  @IsString()
  csvData!: string; // Base64 encoded CSV or raw CSV text

  @IsOptional()
  @IsEnum(['skip', 'update', 'error'])
  duplicateHandling?: 'skip' | 'update' | 'error'; // How to handle duplicates (based on phone)

  @IsOptional()
  @IsString()
  defaultAssignedTo?: string; // Default member to assign all imported leads to
}

export interface ImportLeadRow {
  firstname: string; // CSV headers are lowercased by parser
  lastname: string;
  phone: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  propertytype?: string;
  listingtype?: string;
  budget?: number;
  bedrooms?: number;
  districts?: string; // Comma-separated
  requirements?: string;
  source?: string;
  status?: string;
  priority?: string;
  notes?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  imported: any[];
}

export interface ImportError {
  row: number;
  data: any;
  error: string;
}
