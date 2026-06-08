import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AppointmentStatus {
    BOOKED = 'booked',
    CANCELLED = 'cancelled',
    RESCHEDULED = 'rescheduled',
    COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
    @Prop({ required: true })
    patient_name: string;

    @Prop({ required: true })
    patient_id: string;

    @Prop({ required: true })
    patient_age: string;

    @Prop({ required: true })
    phone_number: string;

    @Prop({ required: true })
    doctor_id: string;

    @Prop({ required: true })
    doctor_name: string;

    @Prop({ required: true })
    appointment_date: string; // YYYY-MM-DD

    @Prop({ required: true })
    appointment_time: string; // HH:mm

    @Prop({ required: true, unique: true })
    appointment_id: string;

    @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.BOOKED })
    status: AppointmentStatus;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Compound index for double booking prevention: doctor_name, date, and time
AppointmentSchema.index({ doctor_name: 1, appointment_date: 1, appointment_time: 1 }, { unique: true });
