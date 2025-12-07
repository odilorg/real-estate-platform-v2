import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@repo/database';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const StartConversationDto = z.object({
  propertyId: z.string(),
  message: z.string().min(1),
});
type StartConversationDto = z.infer<typeof StartConversationDto>;

const SendMessageDto = z.object({
  content: z.string().min(1),
});
type SendMessageDto = z.infer<typeof SendMessageDto>;

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: User) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.getConversation(id, user.id);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(
      id,
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('start')
  startConversation(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(StartConversationDto)) dto: StartConversationDto,
  ) {
    return this.messagesService.startConversation(
      user.id,
      dto.propertyId,
      dto.message,
    );
  }

  @Post('conversations/:id')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(SendMessageDto)) dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(id, user.id, dto.content);
  }

  @Get('unread')
  getUnreadCount(@CurrentUser() user: User) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
