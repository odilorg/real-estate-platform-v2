import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString, IsEmail, MinLength, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { AgencyRole, AgentType } from '@repo/database';

class NewUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateMemberDto {
  // Option 1: Existing user
  @IsOptional()
  @ValidateIf(o => !o.newUser)
  @IsString()
  userId?: string;

  // Option 2: New user
  @IsOptional()
  @ValidateIf(o => !o.userId)
  @ValidateNested()
  @Type(() => NewUserDto)
  newUser?: NewUserDto;

  @IsEnum(AgencyRole)
  role!: AgencyRole;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  districts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegram?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  permissions?: any;
}
