import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ChatDto } from './dto/chat.dto';
import { Message } from './schemas/message.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ChatService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @InjectModel(Message.name) private messageModel: Model<Message>
    ) { }

    async forwardStream(chatDto: ChatDto, token: string) {
        const url = this.configService.get<string>('CHATBOT_API_URL');
        if (!url) {
            throw new HttpException(
                'Chatbot API URL not configured',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${url}/chat`, chatDto, {
                    responseType: 'stream',
                    timeout: 60000, // 60 seconds timeout
                    headers: {
                        Authorization: token,
                    },
                })
            );

            return response.data;
        } catch (error: any) {
            throw new HttpException(
                error.response?.data?.message || 'Error connecting to streaming service',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    async getHistory(thread_id: string) {
        try {
            const messages = await this.messageModel
                .find({ thread_id })
                .sort({ createdAt: 1 })
                .select('role content createdAt -_id')
                .lean();

            return messages;

        } catch (error) {
            throw new HttpException(
                'Failed to fetch messages from database.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async saveMessage(data: {
        thread_id: string;
        role: 'user' | 'assistant';
        content: string;
    }) {
        await this.messageModel.create({
            thread_id: data.thread_id,
            role: data.role,
            content: data.content,
            createdAt: new Date(),
        });
    }

}
