import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './schemas/doctor.schema';
import { Appointment } from '../appointment/schemas/appointment.schema';
import { UpdateAvailabilityDto } from './dto/availability.dto';

@Injectable()
export class DoctorService {
    constructor(
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    ) { }

    async findAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
        const doctorAppointments = await  this.appointmentModel.find({
            doctor_id: doctorId.toString(),
            status: 'booked',
        });
        return doctorAppointments
    }

    async updateAvailability(email: string, updateAvailabilityDto: UpdateAvailabilityDto): Promise<Doctor> {
        const doctor = await this.doctorModel.findOneAndUpdate(
            { email },
            { availability: updateAvailabilityDto.availability },
            { new: true },
        );
        if (!doctor) throw new NotFoundException('Doctor profile not found');
        return doctor;
    }
}
