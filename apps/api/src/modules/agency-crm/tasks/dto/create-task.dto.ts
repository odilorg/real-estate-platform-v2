import { IsString, IsOptional, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator';
import { TaskType, TaskPriority } from '@repo/database';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TaskType)
  type!: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsString()
  assignedToId!: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsDateString()
  dueDate!: string;
}
