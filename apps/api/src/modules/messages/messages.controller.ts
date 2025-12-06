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

const StartConversationDto = z.object({
  propertyId: z.string(),
  message: z.string().min(1),
});

const SendMessageDto = z.object({
  content: z.string().min(1),
});

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
  startConversation(@CurrentUser() user: User, @Body() dto: any) {
    const validated = StartConversationDto.parse(dto);
    return this.messagesService.startConversation(
      user.id,
      validated.propertyId,
      validated.message,
    );
  }

  @Post('conversations/:id')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: any,
  ) {
    const validated = SendMessageDto.parse(dto);
    return this.messagesService.sendMessage(id, user.id, validated.content);
  }

  @Get('unread')
  getUnreadCount(@CurrentUser() user: User) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
