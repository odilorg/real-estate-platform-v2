import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}
  
  // TODO: Implement member management (Phase 2)
}
