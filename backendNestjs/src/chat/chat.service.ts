import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
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
        } catch (error:any) {
            throw new HttpException(
                error.response?.data?.message || 'Error connecting to streaming service',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
