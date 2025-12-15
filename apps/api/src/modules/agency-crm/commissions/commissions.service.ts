import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}
}
