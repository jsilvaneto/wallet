import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @IsString()
    @IsOptional()
    parent_id?: string;
}
