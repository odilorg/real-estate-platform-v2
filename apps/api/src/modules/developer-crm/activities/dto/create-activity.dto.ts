import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum ActivityType {
  CALL = 'CALL',
  TELEGRAM = 'TELEGRAM',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  VIEWING = 'VIEWING',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export class CreateActivityDto {
  @IsString()
  leadId!: string;

  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  outcome?: string;
}
