import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { HttpModule } from '@nestjs/axios';
import { AdminController } from './admin.controller';
import { Doctor, DoctorSchema } from '../doctor/schemas/doctor.schema';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      ]),
      HttpModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule { }
