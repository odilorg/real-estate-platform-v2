import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsNotEmpty()
  leadIds!: string[]; // Array of lead IDs to delete
}

export class BulkAssignDto {
  @IsArray()
  @IsNotEmpty()
  leadIds!: string[]; // Array of lead IDs to assign

  @IsString()
  @IsNotEmpty()
  memberId!: string; // Team member to assign leads to
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    leadId: string;
    error: string;
  }>;
}
