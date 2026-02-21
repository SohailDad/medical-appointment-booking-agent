import { IsEmail, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityDto {
    @IsNotEmpty()
    day: string;

    @IsArray()
    @IsString({ each: true })
    timeSlots: string[];
}

export class CreateDoctorDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    specialization: string;

    @IsNumber()
    experience: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilityDto)
    availability: AvailabilityDto[];

    @IsNotEmpty()
    description: string;
}

export class UpdateDoctorDto extends CreateDoctorDto { }
