import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}
}
