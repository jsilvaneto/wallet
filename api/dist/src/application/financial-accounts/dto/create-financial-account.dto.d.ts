import { FinancialAccountType } from '@prisma/client';
export declare class CreateFinancialAccountDto {
    name: string;
    type: FinancialAccountType;
    initial_balance: number;
}
