import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

@Schema({ timestamps: true })
export class Report extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId;

    @Prop({ required: true })
    appointmentId: string;

    @Prop({ required: true })
    patient_name: string;

    @Prop({ required: true })
    report_name: string;

    @Prop({ required: true })
    file_path: string;

    @Prop({ required: true })
    file_type: string;

    @Prop({ default: Date.now })
    uploaded_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
