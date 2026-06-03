import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RegisterDoctorDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('register-patient')
    async registerPatient(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('register-doctor')
    async registerDoctor(@Body() registerDoctorDto: RegisterDoctorDto) {
        return this.authService.registerDoctor(registerDoctorDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }
}
