import { IsEmail, IsEnum, IsNotEmpty, MinLength, IsOptional, IsString, IsNumber } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class SignupDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    role: UserRole;
}

export class RegisterDoctorDto extends SignupDto {
    @IsNotEmpty()
    @IsString()
    specialization: string;

    @IsNotEmpty()
    @IsString()
    degree: string;

    @IsNotEmpty()
    @IsNumber()
    experience: number;

    @IsNotEmpty()
    @IsString()
    licenseNumber: string;

    @IsNotEmpty()
    @IsString()
    description: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
