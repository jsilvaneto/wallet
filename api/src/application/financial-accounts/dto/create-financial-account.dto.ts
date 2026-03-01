import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { FinancialAccountType } from '@prisma/client';

export class CreateFinancialAccountDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(FinancialAccountType)
    @IsNotEmpty()
    type: FinancialAccountType;

    @IsNumber()
    @IsNotEmpty()
    initial_balance: number;
}
