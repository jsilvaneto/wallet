import { FinancialAccountType } from '@prisma/client';
export declare class UpdateFinancialAccountDto {
    name?: string;
    type?: FinancialAccountType;
    initial_balance?: number;
}
