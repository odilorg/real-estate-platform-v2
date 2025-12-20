import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class TelegramShareService {
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.botToken = this.config.get('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.config.get('TELEGRAM_CHAT_ID') || '';
  }

  async sharePropertyToTelegram(propertyId: string): Promise<{ success: boolean; messageUrl?: string; error?: string }> {
    try {
      if (!this.botToken || !this.chatId) {
        throw new Error('Telegram credentials not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
      }

      // Fetch property with images
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 10, // Telegram allows up to 10 photos in media group
          },
          developer: true,
          developerProject: true,
        },
      });

      if (!property) {
        throw new NotFoundException(`Property with ID ${propertyId} not found`);
      }

      // Format property message
      const message = this.formatPropertyMessage(property);

      // Send to Telegram
      if (property.images.length > 0) {
        // Send as media group with caption
        return await this.sendMediaGroup(property.images.map(img => img.url), message);
      } else {
        // Send as text message only
        return await this.sendMessage(message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private formatPropertyMessage(property: any): string {
    const emoji = this.getPropertyTypeEmoji(property.propertyType);
    const priceFormatted = this.formatPrice(property.price, property.currency);

    let message = `${emoji} ${property.title}\n\n`;

    // Location
    message += `📍 Location: ${property.city}`;
    if (property.district) {
      message += `, ${property.district}`;
    }
    message += `\n`;

    // Price
    message += `💵 Price: ${priceFormatted}\n`;

    // Property details
    if (property.area) {
      message += `📐 Area: ${property.area} m²\n`;
    }
    if (property.bedrooms) {
      message += `🛏 Bedrooms: ${property.bedrooms}`;
      if (property.bathrooms) {
        message += ` | 🚿 Bathrooms: ${property.bathrooms}`;
      }
      message += `\n`;
    }
    if (property.floor && property.totalFloors) {
      message += `🏢 Floor: ${property.floor}/${property.totalFloors}\n`;
    }

    // Developer/Project info
    if (property.developer) {
      message += `🏗 Developer: ${property.developer.companyName}\n`;
    }
    if (property.developerProject) {
      message += `🏘 Project: ${property.developerProject.name}\n`;
    }

    // Description (truncated if too long)
    if (property.description) {
      const desc = property.description.length > 200
        ? property.description.substring(0, 200) + '...'
        : property.description;
      message += `\n✨ ${desc}\n`;
    }

    // Link to listing
    const frontendUrl = this.config.get('FRONTEND_URL') || 'https://staging.jahongir-app.uz';
    message += `\n🔗 View details: ${frontendUrl}/ru/properties/${property.id}`;

    return message;
  }

  private getPropertyTypeEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      'APARTMENT': '🏢',
      'HOUSE': '🏠',
      'VILLA': '🏡',
      'TOWNHOUSE': '🏘',
      'LAND': '🌳',
      'COMMERCIAL': '🏪',
      'OFFICE': '🏢',
    };
    return emojiMap[type] || '🏘';
  }

  private formatPrice(price: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'UZS': 'UZS',
      'RUB': '₽',
    };

    const symbol = currencySymbols[currency] || currency;
    const formatted = new Intl.NumberFormat('en-US').format(price);

    return currency === 'USD' ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
  }

  private async sendMediaGroup(photoUrls: string[], caption: string): Promise<{ success: boolean; messageUrl?: string }> {
    const media = photoUrls.map((url, index) => ({
      type: 'photo',
      media: url,
      ...(index === 0 && { caption, parse_mode: 'HTML' }),
    }));

    const response = await this.sendTelegramRequest('sendMediaGroup', {
      chat_id: this.chatId,
      media: JSON.stringify(media),
    });

    return {
      success: true,
      messageUrl: response.ok ? `https://t.me/c/${this.chatId}/${response.result[0].message_id}` : undefined,
    };
  }

  private async sendMessage(text: string): Promise<{ success: boolean; messageUrl?: string }> {
    const response = await this.sendTelegramRequest('sendMessage', {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
    });

    return {
      success: true,
      messageUrl: response.ok ? `https://t.me/c/${this.chatId}/${response.result.message_id}` : undefined,
    };
  }

  private sendTelegramRequest(method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams(data).toString();
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${this.botToken}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
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
