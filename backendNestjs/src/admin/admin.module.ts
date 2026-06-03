import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { HttpModule } from '@nestjs/axios';
import { AdminController } from './admin.controller';
import { Doctor, DoctorSchema } from '../doctor/schemas/doctor.schema';
import { Appointment, AppointmentSchema } from '../appointment/schemas/appointment.schema';
import { User, UserSchema } from 'src/auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: User.name, schema: UserSchema },
      ]),
      HttpModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule { }
