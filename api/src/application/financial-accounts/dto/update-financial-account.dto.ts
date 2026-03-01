import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FinancialAccountType } from '@prisma/client';

export class UpdateFinancialAccountDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(FinancialAccountType)
    @IsOptional()
    type?: FinancialAccountType;

    @IsNumber()
    @IsOptional()
    initial_balance?: number;
}
