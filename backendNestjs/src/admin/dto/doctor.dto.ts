import { IsEmail, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityDto {
  @IsNotEmpty()
  @IsString()
  day: string;

  @IsNotEmpty()
  startTime: string;

  @IsNotEmpty()
  endTime: string;
}

export class CreateDoctorDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    doctor_id: string;

    @IsNotEmpty()
    specialization: string;

    @IsNotEmpty()
    degree: string;

    @IsNotEmpty()
    licenceNumber: string;

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
