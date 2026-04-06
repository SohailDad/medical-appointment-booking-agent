import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async signup(signupDto: SignupDto): Promise<{user: User, token:string}> {
        const { name, email, password, role } = signupDto;

        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 3600000); // 1 hour

        const user = new this.userModel({
            name,
            email,
            password: hashedPassword,
            role,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
        });

        const savedUser = await user.save();

        // Send emails (non-blocking)
        // this.mailService.sendWelcomeEmail(name, email);
        // this.mailService.sendVerificationEmail(name, email, verificationToken);

        const payload = { sub: user._id, email: user.email, role: user.role };
        return {
            user: savedUser,
            token: await this.jwtService.signAsync(payload)
        };
    }

    async login(loginDto: LoginDto): Promise<{user: User, token:string}> {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your email address');
        }

        const payload = { sub: user._id, email: user.email, role: user.role };
       return {
            user,
            token: await this.jwtService.signAsync(payload)
        };
    }

    async verifyEmail(token: string) {
        const user = await this.userModel.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired verification token');
        }

        user.isVerified = true;
        (user as any).emailVerificationToken = undefined;
        (user as any).emailVerificationExpires = undefined;
        await user.save();

        return { message: 'Email verified successfully' };
    }

    async forgotPassword(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            // We don't want to reveal if a user exists
            return { message: 'If your email is registered, you will receive a reset link' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        this.mailService.sendResetPasswordEmail(user.name, user.email, resetToken);

        return { message: 'If your email is registered, you will receive a reset link' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        (user as any).resetPasswordToken = undefined;
        (user as any).resetPasswordExpires = undefined;
        await user.save();

        return { message: 'Password reset successfully' };
    }
}
