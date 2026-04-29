import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';

@Module({
    imports: [
        HttpModule,
        ConfigModule,
        MongooseModule.forFeature([
            { name: Message.name, collection: 'messages', schema: MessageSchema }
        ]),
    ],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule { }
