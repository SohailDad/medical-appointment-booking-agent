import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityDto } from '../../admin/dto/doctor.dto';

export class UpdateAvailabilityDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilityDto)
    availability: AvailabilityDto[];
}
