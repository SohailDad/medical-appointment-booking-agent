import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { UpdateAvailabilityDto } from './dto/availability.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) { }

    @Get('appointments')
    async getMyAppointments(@Req() req: any) {
        // Assuming user.name is used to match doctor_name in appointments
        return this.doctorService.findAppointmentsByDoctor(req.user._id);
    }

    @Put('availability')
    async updateMyAvailability(@Req() req: any, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
        return this.doctorService.updateAvailability(req.user.email, updateAvailabilityDto);
    }
}
