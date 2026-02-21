import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post('upload')
    @Roles(UserRole.PATIENT)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/reports',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                    cb(null, true);
                } else {
                    cb(new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST), false);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadReport(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }

        const { user } = req;
        const report = await this.reportsService.createReport(
            user._id,
            user.name,
            file.originalname,
            file.path,
            file.mimetype.includes('pdf') ? 'pdf' : 'image',
        );

        return report;
    }

    @Get('my')
    @Roles(UserRole.PATIENT)
    async getMyReports(@Req() req: any) {
        return this.reportsService.getMyReports(req.user._id);
    }

    @Delete(':id')
    @Roles(UserRole.PATIENT)
    async deleteReport(@Param('id') id: string, @Req() req: any) {
        return this.reportsService.deleteReport(id, req.user._id);
    }
}
