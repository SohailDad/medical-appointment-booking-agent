import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ChatModule } from './chat/chat.module';
import { MailModule } from './mail/mail.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://localhost:27017/medical-booking'),
    AuthModule,
    AdminModule,
    DoctorModule,
    AppointmentModule,
    ChatModule,
    MailModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
