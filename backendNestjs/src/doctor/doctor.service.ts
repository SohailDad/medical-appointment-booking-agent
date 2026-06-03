import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './schemas/doctor.schema';
import { Appointment, AppointmentStatus } from '../appointment/schemas/appointment.schema';
import { UpdateAvailabilityDto } from './dto/availability.dto';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class DoctorService {
    constructor(
        // private readonly configService: ConfigService,
        // private readonly httpService: HttpService,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    ) { }

    async findAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
        const doctorAppointments = await this.appointmentModel.find({
            doctor_id: doctorId.toString(),
            status: {
                $in: [AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED],
            },
        });

        return doctorAppointments;
    }

    async findAppointmentsAndComplete(id: string) {
        const bookedAppointment = await this.appointmentModel.findById({ _id: id })
        if (!bookedAppointment) {
            throw new NotFoundException('Appointment not found')
        }
        bookedAppointment.status = AppointmentStatus.COMPLETED
        await bookedAppointment.save()

        return {
            success: true,
            message: 'Appointment marked as completed successfully.',
        };
    }

    async findAvailabilityByDoctor(email: string) {
        const doctor = await this.doctorModel.findOne({ email: email })
        if (!doctor) throw new NotFoundException('Availability not found')
        return doctor.availability
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

    //Profile

    // async createProfile(createProfileDto: CreateProfileDto): Promise<{
    //     statusCode: HttpStatus.CREATED,
    //     message: string
    // }> {
    //     const existingDoctor = await this.doctorModel.findOne({
    //         email: createProfileDto.email,
    //     });

    //     if (existingDoctor) {
    //         throw new ConflictException('Doctor with this email already exists');
    //     }

    //     try {
    //         const url = this.configService.get<string>('CHATBOT_API_URL');
    //         if (!url) {
    //             throw new HttpException(
    //                 'Chatbot API URL not configured',
    //                 HttpStatus.INTERNAL_SERVER_ERROR,
    //             );
    //         }

    //         const doctor = new this.doctorModel(createProfileDto);
    //         await doctor.save();
    //         const chromadbDoctorData = {
    //             "doctor_id": doctor._id,
    //             "name": doctor.name,
    //             "specialization": doctor.specialization,
    //             // "degree:"dcotor.degree,
    //             "experience": doctor.experience,
    //             "availability": doctor.availability,
    //             "description": doctor.description
    //         }
    //         await firstValueFrom(
    //             this.httpService.post(`${url}/doctors/`, chromadbDoctorData)
    //         );
    //         return {
    //             statusCode: HttpStatus.CREATED,
    //             message: "Doctor profile created successfully"
    //         };
    //     } catch (error: any) {
    //         //Race condition safety
    //         if (error.code === 11000) {
    //             throw new ConflictException('Profile with this email already exists');
    //         }

    //         throw new InternalServerErrorException('Failed to create Profile');
    //     }

    // }

    // async UpdateProfile(updateProfileDto: UpdateProfileDto) {

    // }

    // async findProfile() {

    // }
}
