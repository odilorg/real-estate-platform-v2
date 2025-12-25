import { IsOptional, IsEnum, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { AgencyRole, AgentType } from '@repo/database';
import { Type } from 'class-transformer';

export class QueryMembersDto {
  @IsOptional()
  @IsEnum(AgencyRole)
  role?: AgencyRole;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number = 20;
}
