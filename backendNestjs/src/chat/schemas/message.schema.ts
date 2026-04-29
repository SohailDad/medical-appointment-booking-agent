import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
    @Prop({ required: true })
    thread_id: string;

    @Prop({ required: true, enum: ['user', 'assistant'] })
    role: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);