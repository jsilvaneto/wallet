import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCostCenterDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
