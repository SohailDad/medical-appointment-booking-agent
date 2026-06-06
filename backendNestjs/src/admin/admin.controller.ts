import { Controller, Post, Body, Put, Param, Delete, Get, UseGuards, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('doctors')
    async addDoctor(@Body() createDoctorDto: CreateDoctorDto) {
        return this.adminService.createDoctor(createDoctorDto);
    }

    @Put('doctors/:id')
    async updateDoctor(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
        return this.adminService.updateDoctor(id, updateDoctorDto);
    }

    @Delete('doctors/:id')
    async deleteDoctor(@Param('id') id: string) {
        return this.adminService.deleteDoctor(id);
    }

    @Get('doctors')
    async viewAllDoctors() {
        return this.adminService.findAllDoctors();
    }

    @Get('doctors/pending')
    async getPendingDoctors() {
        return this.adminService.getPendingDoctors();
    }

    @Patch('doctor/approved/:id')
    async approveDoctor(@Param('id') id: string) {
        return this.adminService.approveDoctor(id);
    }

    @Patch('doctor/rejected/:id')
    async rejectDoctor(@Param('id') id: string) {
        return this.adminService.rejectDoctor(id);
    }

    @Get('appointments')
    async viewAllAppointments() {
        return this.adminService.findAllAppointments();
    }


    @Get('users')
    async viewAllUsers(){
        return this.adminService.findAllUsers();
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') id: string){
        return this.adminService.deleteUser(id);
    }
}
