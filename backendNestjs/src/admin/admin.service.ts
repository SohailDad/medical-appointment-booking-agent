import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Doctor } from '../doctor/schemas/doctor.schema';
import { Appointment } from '../appointment/schemas/appointment.schema';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/auth/schemas/user.schema';

@Injectable()
export class AdminService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(User.name) private userModel: Model<User>,
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

            const doctor = new this.doctorModel(createDoctorDto);
            await doctor.save();
            const chromadbDoctorData = {
                "doctor_id": doctor._id,
                "name": doctor.name,
                "specialization": doctor.specialization,
                "experience": doctor.experience,
                "availability": doctor.availability,
                "description": doctor.description
            }
            await firstValueFrom(
                this.httpService.post(`${url}/doctors/`, chromadbDoctorData)
            );
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
            // Update in MongoDB
            const updateDoctor = await this.doctorModel.findByIdAndUpdate(
                id,
                updateDoctorDto,
                { new: true }
            );
            if (!updateDoctor) {
                throw new NotFoundException('Doctor not found');
            }

            const chromadbUpdateDoctor = {
                "name": updateDoctor.name,
                "specialization": updateDoctor.specialization,
                "experience": updateDoctor.experience,
                "availability": updateDoctor.availability,
                "description": updateDoctor.description,
            };
            const doctor_id = updateDoctor._id.toString()
            await firstValueFrom(
                this.httpService.put(`${url}/doctors/${doctor_id}`, chromadbUpdateDoctor)
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
                this.httpService.delete(`${url}/doctors/${doctor._id}`)
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


    async getPendingDoctors(): Promise<User[]> {
        return this.userModel.find({ role: 'doctor', status: 'pending' }).select('-password');
    }

    async approveDoctor(id: string): Promise<{ statusCode: number; message: string }> {
        const user = await this.userModel.findById(id);
        if (!user || user.role !== 'doctor') {
            throw new NotFoundException('Doctor not found');
        }

        user.status = 'approved';
        await user.save();

        // Also add them to the Doctor collection so the rest of the system works
        try {
            await this.createDoctor({
                name: user.name,
                email: user.email,
                doctor_id: id,
                specialization: user.specialization!,
                degree: user.degree!,
                licenceNumber: user.licenceNumber!,
                experience: user.experience!,
                description: user.description!,
                availability: [] // Empty by default
            });

            const url = this.configService.get<string>('CHATBOT_API_URL');
            if (!url) {
                throw new HttpException(
                    'Chatbot API URL not configured',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            const chromadbDoctorData = {
                "doctor_id": id,
                "name": user.name,
                "specialization": user.specialization,
                "experience": user.experience,
                "availability": [],
                "description": user.description
            }
            await firstValueFrom(
                this.httpService.post(`${url}/doctors/`, chromadbDoctorData)
            );
            return {
                statusCode: HttpStatus.CREATED,
                message: "Doctor created successfully"
            };
        } catch (e:any) {
            // If they already exist, just ignore it.
            console.log("Doctor already exists in Doctor collection", e.message);
        }

        return { statusCode: HttpStatus.OK, message: 'Doctor approved successfully' };
    }

    async rejectDoctor(id: string): Promise<{ statusCode: number; message: string }> {
        const user = await this.userModel.findById(id);
        if (!user || user.role !== 'doctor') {
            throw new NotFoundException('Doctor not found');
        }

        user.status = 'rejected';
        await user.save();

        return { statusCode: HttpStatus.OK, message: 'Doctor rejected successfully' };
    }


    async findAllUsers(): Promise<User[]>{
        const allUsers = await this.userModel.find()
        return allUsers
    }


    async deleteUser(id: string): Promise<{ statusCode: number; message: string }>{
        const user = await this.userModel.findByIdAndDelete(id)
        if(!user){
            throw new NotFoundException('User not found');
        }
        return { statusCode: HttpStatus.OK, message: 'Doctor rejected successfully' };
    }
}


