import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<Report>,
    ) { }

    async createReport(
        patientId: string,
        patientName: string,
        reportName: string,
        filePath: string,
        fileType: string,
        appointmentId: string,
    ): Promise<Report> {
        const report = new this.reportModel({
            patientId: new Types.ObjectId(patientId),
            appointmentId: appointmentId ,
            patient_name: patientName,
            report_name: reportName,
            file_path: filePath,
            file_type: fileType,
        });
        return report.save();
    }

    async getMyReports(patientId: string): Promise<Report[]> {
        return this.reportModel.find({ patientId: new Types.ObjectId(patientId) }).sort({ uploaded_at: -1 }).exec();
    }

    async getReportsByAppointment(appointmentId: string): Promise<Report[]> {
        return this.reportModel.find({ appointmentId: appointmentId }).sort({ uploaded_at: -1 }).exec();
    }

    async deleteReport(reportId: string, patientId: string): Promise<{ message: string }> {
        const report = await this.reportModel.findById(reportId);

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (report.patientId.toString() !== patientId.toString()) {
            throw new UnauthorizedException('You can only delete your own reports');
        }

        // Delete file from disk
        const absolutePath = path.resolve(report.file_path);
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        await this.reportModel.findByIdAndDelete(reportId);
        return { message: 'Report deleted successfully' };
    }
}
