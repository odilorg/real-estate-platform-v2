import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsOptional, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastContactedAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextFollowUpAt?: Date;

  @IsOptional()
  @IsNumber()
  totalContacts?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  convertedAt?: Date;

  @IsOptional()
  @IsNumber()
  conversionValue?: number;
}
