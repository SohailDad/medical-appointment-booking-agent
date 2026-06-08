import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  // Doctor-specific fields
  @Prop({ enum: ['pending', 'approved', 'rejected'] })
  status?: string;

  @Prop()
  specialization?: string;

  @Prop()
  degree?: string;

  @Prop()
  experience?: number;

  @Prop()
  licenceNumber?: string;

  @Prop()
  description?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
