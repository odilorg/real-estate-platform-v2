import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

export interface TelegramNotificationOptions {
  chatId: string; // Can be @username, phone number, or numeric chat_id
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private readonly botToken: string;
  private readonly isEnabled: boolean;

  constructor(private config: ConfigService) {
    this.botToken = this.config.get('TELEGRAM_CRM_BOT_TOKEN') || this.config.get('TELEGRAM_BOT_TOKEN') || '';
    this.isEnabled = !!this.botToken;

    if (!this.isEnabled) {
      this.logger.warn('Telegram CRM notifications disabled: TELEGRAM_CRM_BOT_TOKEN not configured');
    } else {
      this.logger.log('Telegram CRM notification service initialized');
    }
  }

  /**
   * Send a notification to a Telegram user
   * @param options - chatId can be @username or numeric chat_id
   */
  async sendNotification(options: TelegramNotificationOptions): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.log(`[TELEGRAM DISABLED] Would send to ${options.chatId}: ${options.message}`);
      return false;
    }

    try {
      const response = await this.sendTelegramRequest('sendMessage', {
        chat_id: options.chatId,
        text: options.message,
        parse_mode: options.parseMode || 'HTML',
      });

      if (response.ok) {
        this.logger.log(`Telegram notification sent to ${options.chatId}`);
        return true;
      } else {
        this.logger.error(`Telegram API error: ${response.description}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification: ${error}`);
      return false;
    }
  }

  /**
   * Send task due soon notification
   */
  async sendTaskDueSoonNotification(
    chatId: string,
    userName: string,
    taskTitle: string,
    dueDate: Date,
    taskId: string,
    leadName?: string,
  ): Promise<boolean> {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://staging.jahongir-app.uz';
    const formattedDate = dueDate.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `<b>Задача скоро истекает</b>\n\n`;
    message += `Здравствуйте, ${userName}!\n\n`;
    message += `<b>"${taskTitle}"</b>\n`;
    message += `Срок: ${formattedDate}\n`;
    if (leadName) {
      message += `Лид: ${leadName}\n`;
    }
    message += `\n<a href="${frontendUrl}/ru/developer/crm/tasks/${taskId}">Открыть задачу</a>`;

    return this.sendNotification({ chatId, message });
  }

  /**
   * Send task overdue notification
   */
  async sendTaskOverdueNotification(
    chatId: string,
    userName: string,
    taskTitle: string,
    dueDate: Date,
    taskId: string,
    leadName?: string,
  ): Promise<boolean> {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://staging.jahongir-app.uz';
    const formattedDate = dueDate.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `<b>Задача просрочена!</b>\n\n`;
    message += `Здравствуйте, ${userName}!\n\n`;
    message += `<b>"${taskTitle}"</b>\n`;
    message += `Срок был: ${formattedDate}\n`;
    if (leadName) {
      message += `Лид: ${leadName}\n`;
    }
    message += `\n<a href="${frontendUrl}/ru/developer/crm/tasks/${taskId}">Открыть задачу</a>`;

    return this.sendNotification({ chatId, message });
  }

  /**
   * Send new lead assigned notification
   */
  async sendNewLeadNotification(
    chatId: string,
    userName: string,
    leadName: string,
    leadPhone: string,
    propertyType: string,
    leadId: string,
  ): Promise<boolean> {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://staging.jahongir-app.uz';
    const propertyTypeLabels: Record<string, string> = {
      APARTMENT: 'Квартира',
      HOUSE: 'Дом',
      COMMERCIAL: 'Коммерция',
      LAND: 'Участок',
    };

    let message = `<b>Новый лид назначен!</b>\n\n`;
    message += `Здравствуйте, ${userName}!\n\n`;
    message += `<b>${leadName}</b>\n`;
    message += `Телефон: ${leadPhone}\n`;
    message += `Тип: ${propertyTypeLabels[propertyType] || propertyType}\n`;
    message += `\n<a href="${frontendUrl}/ru/developer/crm/leads/${leadId}">Открыть лид</a>`;

    return this.sendNotification({ chatId, message });
  }

  /**
   * Send deal status change notification
   */
  async sendDealStatusNotification(
    chatId: string,
    userName: string,
    leadName: string,
    oldStatus: string,
    newStatus: string,
    dealValue: number,
    dealId: string,
  ): Promise<boolean> {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://staging.jahongir-app.uz';
    const statusLabels: Record<string, string> = {
      NEGOTIATION: 'Переговоры',
      CONTRACT_SIGNED: 'Договор подписан',
      DEPOSIT_RECEIVED: 'Депозит получен',
      PAYMENT_IN_PROGRESS: 'Оплата в процессе',
      COMPLETED: 'Завершена',
      CANCELLED: 'Отменена',
    };

    let message = `<b>Статус сделки изменён</b>\n\n`;
    message += `Здравствуйте, ${userName}!\n\n`;
    message += `Сделка с <b>${leadName}</b>\n`;
    message += `${statusLabels[oldStatus] || oldStatus} → <b>${statusLabels[newStatus] || newStatus}</b>\n`;
    message += `Сумма: $${dealValue.toLocaleString()}\n`;
    message += `\n<a href="${frontendUrl}/ru/developer/crm/deals/${dealId}">Открыть сделку</a>`;

    return this.sendNotification({ chatId, message });
  }

  private sendTelegramRequest(method: string, data: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${this.botToken}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}
