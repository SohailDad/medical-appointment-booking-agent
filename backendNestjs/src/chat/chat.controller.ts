import { Controller, Post, Body, UseGuards, Res, Req, HttpStatus, Get, HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { Response } from 'express';


@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    @Roles(UserRole.PATIENT)
    async chatStream(
        @Body() chatDto: ChatDto,
        @Res() res: Response,
        @Req() req: any
    ) {
        try {
            chatDto.thread_id = req.user._id;
            const token = req.headers.authorization;
            // save user message BEFORE stream starts
            await this.chatService.saveMessage({
                thread_id: chatDto.thread_id,
                role: 'user',
                content: chatDto.message,
            });

            const stream = await this.chatService.forwardStream(chatDto, token);

            // SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            let fullResponse = '';

            stream.on('data', (chunk: Buffer) => {
                const raw = chunk.toString();
                res.write(raw); // pipe raw SSE to frontend

                // extract clean text from SSE chunks
                const lines = raw.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.replace('data: ', '').trim());
                            if (json.type === 'text' && json.content) {
                                fullResponse += json.content;
                            }
                        } catch {
                            // skip non-json lines
                        }
                    }
                }
            });

            stream.on('end', async () => {
                try {
                    if (fullResponse.trim()) {
                        await this.chatService.saveMessage({
                            thread_id: chatDto.thread_id,
                            role: 'assistant',
                            content: fullResponse.trim(),
                        });
                    }
                } catch (err) {
                    console.error('Failed to save AI response:', err);
                } finally {
                    res.end();
                }
            });

            stream.on('error', (err: Error) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                }
                res.end();
            });

            res.on('close', () => {
                stream.destroy();
            });

        } catch (error: any) {
            if (!res.headersSent) {
                res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: error.message || 'Failed to connect to streaming service',
                });
            } else {
                res.end();
            }
        }
    }


    @Get('/history')
    @Roles(UserRole.PATIENT)
    async getHistory(@Req() req: any) {
        try {
            const thread_id = req.user._id;

            if (!thread_id) {
                throw new HttpException('User ID not found.', HttpStatus.UNAUTHORIZED);
            }

            const messages = await this.chatService.getHistory(thread_id);

            if (!messages || messages.length === 0) {
                return {
                    thread_id,
                    count: 0,
                    conversation: [],
                    message: 'No conversation history found.',
                };
            }

            return {
                thread_id,
                count: messages.length,
                conversation: messages,
            };

        } catch (error: any) {
            throw new HttpException(
                error.message || 'Failed to retrieve conversation history.',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

}
