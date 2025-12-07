import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, Agent } from '@repo/database';
import { RegisterAgentDto, UpdateAgentDto } from '@repo/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * Register current user as an agent
   */
  @Post('register')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(RegisterAgentDto))
  register(@CurrentUser() user: User, @Body() dto: RegisterAgentDto): Promise<Agent> {
    return this.agentsService.register(user.id, dto);
  }

  /**
   * Get current user's agent profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: User): Promise<Agent> {
    return this.agentsService.getByUserId(user.id);
  }

  /**
   * Update current user's agent profile
   */
  @Put('me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateAgentDto))
  updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateAgentDto): Promise<Agent> {
    return this.agentsService.update(user.id, dto);
  }

  /**
   * Get all agents (public, with pagination)
   */
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('agencyId') agencyId?: string,
    @Query('verified') verified?: string,
    @Query('superAgent') superAgent?: string,
  ) {
    return this.agentsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      city,
      agencyId,
      verified: verified === 'true',
      superAgent: superAgent === 'true',
    });
  }

  /**
   * Get agent by ID (public)
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string): Promise<Agent> {
    return this.agentsService.getById(id);
  }

  /**
   * Delete agent profile (self or admin)
   */
  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.agentsService.delete(user.id, targetUserId);
  }
}
