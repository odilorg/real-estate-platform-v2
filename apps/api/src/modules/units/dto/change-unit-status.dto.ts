import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeUnitStatusDto {
  @IsEnum(['AVAILABLE', 'RESERVED', 'SOLD', 'HANDED_OVER'])
  status!: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'HANDED_OVER';

  @IsString()
  @IsOptional()
  reservedBy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
