import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import { BookAppointmentDto, RescheduleAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentService {
    constructor(
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    ) { }

    async book(bookAppointmentDto: BookAppointmentDto): Promise<Appointment> {
        const { doctor_name, appointment_date, appointment_time } = bookAppointmentDto;

        const existing = await this.appointmentModel.findOne({
            doctor_name,
            appointment_date,
            appointment_time,
            status: AppointmentStatus.BOOKED,
        });

        if (existing) {
            throw new ConflictException('Doctor is already booked for this time slot');
        }

        const appointment = new this.appointmentModel(bookAppointmentDto);
        return appointment.save();
    }

    // change the id into appointment_id
    async reschedule(id: string, rescheduleDto: RescheduleAppointmentDto): Promise<Appointment> {
        const { appointment_date, appointment_time } = rescheduleDto;
        console.log("id:",id)
        // Check if new slot is business as usual for double booking
        const appointment = await this.appointmentModel.findOne({appointment_id:id});
        if (!appointment) throw new NotFoundException('Appointment not found');

        const existing = await this.appointmentModel.findOne({
            doctor_name: appointment.doctor_name,
            appointment_date,
            appointment_time,
            status: AppointmentStatus.BOOKED,
            appointment_id: { $ne: id },
        });

        if (existing) {
            throw new ConflictException('Doctor is already booked for this time slot');
        }
        appointment.appointment_date = appointment_date;
        appointment.appointment_time = appointment_time;
        appointment.status = AppointmentStatus.RESCHEDULED;

        return appointment.save();
    }

    async cancel(id: string): Promise<Appointment> {
        const appointment = await this.appointmentModel.findOne({appointment_id:id});
        if (!appointment) throw new NotFoundException('Appointment not found');

        appointment.status = AppointmentStatus.CANCELLED;
        return appointment.save();
    }

    async findByPatient(patient_id: string): Promise<Appointment[]> {
        return this.appointmentModel.find({ patient_id: patient_id });
    }
}
