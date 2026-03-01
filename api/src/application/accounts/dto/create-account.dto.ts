import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionType, RecurrenceType } from '@prisma/client';

export class CreateAccountDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @IsString()
    @IsNotEmpty()
    category_id: string;

    @IsString()
    @IsOptional()
    cost_center_id?: string;

    @IsString()
    @IsNotEmpty()
    financial_account_id: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    competence_date: string;

    @IsDateString()
    @IsNotEmpty()
    due_date: string;

    @IsDateString()
    @IsOptional()
    payment_date?: string;

    @IsEnum(RecurrenceType)
    @IsOptional()
    recurrence_type?: RecurrenceType = RecurrenceType.NONE;

    @IsNumber()
    @IsOptional()
    recurrence_interval?: number;

    @IsBoolean()
    @IsOptional()
    is_fixed?: boolean = false;
}
