import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from '../doctor/schemas/doctor.schema';
import { Appointment } from '../appointment/schemas/appointment.schema';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    ) { }

    async createDoctor(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
        const existingDoctor = await this.doctorModel.findOne({
            email: createDoctorDto.email,
        });

        if (existingDoctor) {
            throw new ConflictException('Doctor with this email already exists');
        }

        try {
            const doctor = new this.doctorModel(createDoctorDto);
            return await doctor.save();
        } catch (error:any) {
            // ✅ Race condition safety
            if (error.code === 11000) {
                throw new ConflictException('Doctor with this email already exists');
            }

            throw new InternalServerErrorException('Failed to create doctor');
        }
    }

    async updateDoctor(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
        const doctor = await this.doctorModel.findByIdAndUpdate(id, updateDoctorDto, { new: true });
        if (!doctor) throw new NotFoundException('Doctor not found');
        return doctor;
    }

    async deleteDoctor(id: string): Promise<any> {
        const result = await this.doctorModel.findByIdAndDelete(id);
        if (!result) throw new NotFoundException('Doctor not found');
        return { message: 'Doctor deleted successfully' };
    }

    async findAllDoctors(): Promise<Doctor[]> {
        return this.doctorModel.find();
    }

    async findAllAppointments(): Promise<Appointment[]> {
        return this.appointmentModel.find();
    }
}
