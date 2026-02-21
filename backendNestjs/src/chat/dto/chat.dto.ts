import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    thread_id: string;
}
