import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@realestate.uz';

    // Configure email transporter
    // In production, use a service like SendGrid, AWS SES, or Mailgun
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Email service is ready to send emails');
    } catch (error) {
      this.logger.error('Email service configuration error:', error);
      this.logger.warn('Emails will be logged to console instead of sending');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Real Estate Platform'} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      // If SMTP is not configured, log to console instead
      if (!process.env.SMTP_USER) {
        this.logger.log(`[EMAIL] To: ${options.to}`);
        this.logger.log(`[EMAIL] Subject: ${options.subject}`);
        this.logger.log(`[EMAIL] Content: ${options.text || this.stripHtml(options.html)}`);
        return true;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email templates
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Real Estate Platform!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining our platform. We're excited to have you here!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse thousands of property listings</li>
          <li>Save your favorite properties</li>
          <li>Create saved searches and get notified</li>
          <li>Contact agents directly</li>
        </ul>
        <p>Best regards,<br>Real Estate Platform Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Real Estate Platform!',
      html,
    });
  }

  async sendPropertyMatchNotification(
    to: string,
    userName: string,
    searchName: string,
    properties: Array<{ id: string; title: string; price: number; city: string }>,
  ): Promise<boolean> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const propertyList = properties
      .map(
        (prop) => `
      <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">
          <a href="${baseUrl}/properties/${prop.id}" style="color: #2563eb; text-decoration: none;">
            ${prop.title}
          </a>
        </h3>
        <p style="margin: 5px 0; color: #6b7280;">
          <strong>Price:</strong> $${prop.price.toLocaleString()} |
          <strong>Location:</strong> ${prop.city}
        </p>
        <a href="${baseUrl}/properties/${prop.id}"
           style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
          View Property
        </a>
      </div>
    `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Properties Match Your Search!</h1>
        <p>Hi ${userName},</p>
        <p>We found <strong>${properties.length}</strong> new ${properties.length === 1 ? 'property' : 'properties'} matching your saved search "<strong>${searchName}</strong>":</p>
        ${propertyList}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          You're receiving this email because you have notifications enabled for this saved search.
          <a href="${baseUrl}/saved-searches" style="color: #2563eb;">Manage your saved searches</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `${properties.length} New ${properties.length === 1 ? 'Property' : 'Properties'} Match "${searchName}"`,
      html,
    });
  }

  async sendNewMessageNotification(
    to: string,
    recipientName: string,
    senderName: string,
    propertyTitle: string,
    messagePreview: string,
  ): Promise<boolean> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Message from ${senderName}</h1>
        <p>Hi ${recipientName},</p>
        <p>You have a new message regarding <strong>${propertyTitle}</strong>:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">"${messagePreview}"</p>
        </div>
        <a href="${baseUrl}/messages"
           style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
          Reply to Message
        </a>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${baseUrl}/settings/notifications" style="color: #2563eb;">Manage notification preferences</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `New message from ${senderName}`,
      html,
    });
  }

  async sendViewingRequestNotification(
    to: string,
    ownerName: string,
    requesterName: string,
    propertyTitle: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Viewing Request</h1>
        <p>Hi ${ownerName},</p>
        <p><strong>${requesterName}</strong> has requested to view your property <strong>${propertyTitle}</strong>.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
        </div>
        <a href="${baseUrl}/viewings"
           style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
          Review Request
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Viewing request for ${propertyTitle}`,
      html,
    });
  }

  async sendAgentVerificationEmail(
    to: string,
    agentName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Congratulations! You're Now an Agent</h1>
        <p>Hi ${agentName},</p>
        <p>Your agent registration has been successful! You now have access to agent features:</p>
        <ul>
          <li>Manage your agent profile</li>
          <li>Receive inquiries from potential clients</li>
          <li>Track your property listings performance</li>
          <li>Build your professional reputation</li>
        </ul>
        <p>Next steps:</p>
        <ol>
          <li>Complete your agent profile with photo and bio</li>
          <li>Add your specializations and areas served</li>
          <li>Start listing properties</li>
        </ol>
        <p>Best regards,<br>Real Estate Platform Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Real Estate Platform - Agent Account',
      html,
    });
  }
}
