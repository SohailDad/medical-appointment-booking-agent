import { Controller, Get, Put, Body, UseGuards, Req, Patch, Param, Post } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { UpdateAvailabilityDto } from './dto/availability.dto';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

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

    @Patch("complete/:id")
    async updateAppointInComplete(@Param("id") id: string ){
        return this.doctorService.findAppointmentsAndComplete(id);
    }

    @Get('availability')
    async getAvailability(@Req() req: any){
        return this.doctorService.findAvailabilityByDoctor(req.user.email)
    }

    @Put('availability')
    async updateMyAvailability(@Req() req: any, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
        return this.doctorService.updateAvailability(req.user.email, updateAvailabilityDto);
    }

    // @Post('profile')
    // async addProfile(@Body() createProfileDto: CreateProfileDto){
    //     return this.doctorService.createProfile(createProfileDto);
    // }

    // @Put('profile')
    // async updateProfile(@Body() updateProfileDto: UpdateProfileDto){
    //     return this.doctorService.UpdateProfile(updateProfileDto);
    // }

    @Get('profile/:id')
    async getProfile(@Param("id") id:string){
        console.log(id)
        return this.doctorService.findProfile(id)
    }
}
