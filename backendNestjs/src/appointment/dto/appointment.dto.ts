import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class BookAppointmentDto {
    @IsNotEmpty()
    patient_name: string;
 
    @IsNotEmpty()
    patient_id: string;

    @IsPhoneNumber()
    phone_number: string;

    @IsNotEmpty()
    doctor_id: string;

    @IsNotEmpty()
    doctor_name: string;
    
    @IsNotEmpty()
    appointment_id: string;
    
    @IsNotEmpty()
    appointment_date: string;

    @IsNotEmpty()
    appointment_time: string;

}

export class RescheduleAppointmentDto {
    @IsNotEmpty()
    appointment_date: string;

    @IsNotEmpty()
    appointment_time: string;
}
