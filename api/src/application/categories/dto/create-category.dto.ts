import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @IsString()
    @IsOptional()
    parent_id?: string;
}
