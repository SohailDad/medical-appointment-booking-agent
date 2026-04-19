import { Controller, Post, Body, UseGuards, Res, Req, HttpStatus } from '@nestjs/common';
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
    async chatStream(@Body() chatDto: ChatDto, @Res() res: Response, @Req() req: any) {
        try {
            chatDto.thread_id = req.user._id
            const token = req.headers.authorization;
            const stream = await this.chatService.forwardStream(chatDto,token);

            // Set headers for SSE (Server-Sent Events) or plain text streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if behind nginx

            // Pipe the incoming chatbot stream directly to the outgoing response
            stream.pipe(res);

            // Handle potential stream errors
            stream.on('error', (err: Error) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500);
                }
                res.end();
            });

            // Handle stream end
            stream.on('end', () => {
                res.end();
            });

            // Handle client disconnect
            res.on('close', () => {
                stream.destroy();
            });

        } catch (error: any) {
            if (!res.headersSent) {
                res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
                    .json({
                        error: error.message || 'Failed to connect to streaming service'
                    });
            } else {
                res.end();
            }
        }
    }
}
