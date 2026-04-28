import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Doctor } from '../doctor/schemas/doctor.schema';
import { Appointment } from '../appointment/schemas/appointment.schema';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { firstValueFrom } from 'rxjs';
import { log } from 'console';

@Injectable()
export class AdminService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    ) { }

    async createDoctor(createDoctorDto: CreateDoctorDto): Promise<{
        statusCode: HttpStatus.CREATED,
        message: string
    }> {
        const existingDoctor = await this.doctorModel.findOne({
            email: createDoctorDto.email,
        });

        if (existingDoctor) {
            throw new ConflictException('Doctor with this email already exists');
        }

        try {
            const url = this.configService.get<string>('CHATBOT_API_URL');
            if (!url) {
                throw new HttpException(
                    'Chatbot API URL not configured',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            const chromadbDoctorData = {
                "name": createDoctorDto.name,
                "specialization": createDoctorDto.specialization,
                "experience": createDoctorDto.experience,
                "availability": createDoctorDto.availability,
                "description": createDoctorDto.description
            }
            const doctor = new this.doctorModel(createDoctorDto);
            await firstValueFrom(
                this.httpService.post(`${url}/doctors/`, chromadbDoctorData)
            );
            await doctor.save();
            return {
                statusCode: HttpStatus.CREATED,
                message: "Doctor created successfully"
            };
        } catch (error: any) {
            //Race condition safety
            if (error.code === 11000) {
                throw new ConflictException('Doctor with this email already exists');
            }

            throw new InternalServerErrorException('Failed to create doctor');
        }
    }

    async updateDoctor(
        id: string,
        updateDoctorDto: UpdateDoctorDto
    ): Promise<{ statusCode: number; message: string }> {

        try {
            const doctor = await this.doctorModel.findById(id);

            if (!doctor) {
                throw new NotFoundException('Doctor not found');
            }

            // Check duplicate email (if email is being updated)
            if (updateDoctorDto.email && updateDoctorDto.email !== doctor.email) {
                const existingDoctor = await this.doctorModel.findOne({
                    email: updateDoctorDto.email,
                });

                if (existingDoctor) {
                    throw new ConflictException('Doctor with this email already exists');
                }
            }

           

            //Sync with FastAPI (ChromaDB)
            const url = this.configService.get<string>('CHATBOT_API_URL');

            if (!url) {
                throw new HttpException(
                    'Chatbot API URL not configured',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            const chromadbUpdateDoctor = {
                // name: updateDoctorDto.name,
                "specialization": updateDoctorDto.specialization,
                "experience": updateDoctorDto.experience,
                "availability": updateDoctorDto.availability,
                "description": updateDoctorDto.description,
                // email: updateDoctorDto.email, // important for ID
            };

            await firstValueFrom(
                this.httpService.put(`${url}/doctors/${updateDoctorDto.name}`, chromadbUpdateDoctor)
            );

             // Update in MongoDB
            await this.doctorModel.findByIdAndUpdate(
                id,
                updateDoctorDto,
                { new: true }
            );

            return {
                statusCode: HttpStatus.OK,
                message: "Doctor updated successfully"
            };

        } catch (error: any) {

            //Duplicate key safety
            if (error.code === 11000) {
                throw new ConflictException('Doctor with this email already exists');
            }

            // Known HTTP errors (rethrow)
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update doctor');
        }
    }

    async deleteDoctor(
        id: string
    ): Promise<{ statusCode: number; message: string }> {

        try {
            const doctor = await this.doctorModel.findById(id);

            if (!doctor) {
                throw new NotFoundException('Doctor not found');
            }

            //Delete from MongoDB
            await this.doctorModel.findByIdAndDelete(id);

            // Sync delete with FastAPI (ChromaDB)
            const url = this.configService.get<string>('CHATBOT_API_URL');

            if (!url) {
                throw new HttpException(
                    'Chatbot API URL not configured',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // Use same unique ID used in Chroma (email recommended)
            await firstValueFrom(
                this.httpService.delete(`${url}/doctors/${doctor.name}`)
            );

            return {
                statusCode: HttpStatus.OK,
                message: 'Doctor deleted successfully'
            };

        } catch (error: any) {

            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete doctor');
        }
    }

    async findAllDoctors(): Promise<Doctor[]> {
        return this.doctorModel.find();
    }

    async findAllAppointments(): Promise<Appointment[]> {
        return this.appointmentModel.find();
    }
}


