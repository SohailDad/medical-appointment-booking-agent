import { Controller, Post, Body, Put, Param, Delete, Get, UseGuards, Req, Patch } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto, RescheduleAppointmentDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) { }

    @Post('book')
    @Roles(UserRole.PATIENT)
    async book(@Body() bookAppointmentDto: BookAppointmentDto) {
        return this.appointmentService.book(bookAppointmentDto);
    }

    @Patch('reschedule/:id')
    @Roles(UserRole.PATIENT)
    async reschedule(@Param('id') id: string, @Body() rescheduleDto: RescheduleAppointmentDto) {
        return this.appointmentService.reschedule(id, rescheduleDto);
    }

    @Delete('cancel/:id')
    @Roles(UserRole.PATIENT)
    async cancel(@Param('id') id: string) {
        return this.appointmentService.cancel(id);
    }

    @Get('my')
    @Roles(UserRole.PATIENT)
    async getMyAppointments(@Req() req: any) {
        return this.appointmentService.findByPatient(req.user._id);  //pass the req.user.email(is ly kih agr kise na kise or ka ly book krana ho to pir os ka ly email lekna lazmi.)
    }
}
