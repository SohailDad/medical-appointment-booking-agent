import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('EMAIL_HOST'),
            port: this.configService.get<number>('EMAIL_PORT'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASS'),
            },
        });
    }

    async sendWelcomeEmail(name: string, email: string) {
        const subject = 'Welcome to Medical Appointment System';
        const html = `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining our Medical Appointment System. We are glad to have you here.</p>
    `;
        await this.sendMail(email, subject, html);
    }

    async sendVerificationEmail(name: string, email: string, token: string) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
        const subject = 'Verify Your Email Address';
        const html = `
      <h1>Hello, ${name}</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `;
        await this.sendMail(email, subject, html);
    }

    async sendResetPasswordEmail(name: string, email: string, token: string) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        const subject = 'Reset Your Password';
        const html = `
      <h1>Hello, ${name}</h1>
      <p>You requested to reset your password. Please click the link below:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
        await this.sendMail(email, subject, html);
    }

    private async sendMail(to: string, subject: string, html: string) {
        try {
            await this.transporter.sendMail({
                from: `"Medical System" <${this.configService.get<string>('EMAIL_USER')}>`,
                to,
                subject,
                html,
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            // We don't throw here to avoid blocking user creation, but we log it.
        }
    }
}
