import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Availability {
    @Prop({
        required: true,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    })
    day: string;

    @Prop({ required: true })
    startTime: string;

    @Prop({ required: true })
    endTime: string;

    @Prop()
    breakStart?: string;

    @Prop()
    breakEnd?: string;
}


@Schema({ timestamps: true })
export class Doctor extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    doctor_id: string;

    @Prop({ required: true })
    specialization: string;

    @Prop({ required: true })
    degree:string;

    @Prop({ required: true })
    licenseNumber: string;

    @Prop({ required: true })
    experience: number;

    @Prop({ type: [Availability], default: [] , _id: false})
    availability: Availability[];

    @Prop({ required: true })
    description: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
