import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Availability {
    @Prop({ required: true })
    day: string; // e.g., 'Monday'

    @Prop({ required: true })
    timeSlots: string[]; // e.g., ['09:00', '10:00']
}

@Schema({ timestamps: true })
export class Doctor extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    specialization: string;

    @Prop({ required: true })
    experience: number;

    @Prop({ type: [Availability], default: [] })
    availability: Availability[];

    @Prop({ required: true })
    description: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
