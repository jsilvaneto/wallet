import { TransactionType, RecurrenceType } from '@prisma/client';
export declare class CreateAccountDto {
    description: string;
    type: TransactionType;
    category_id: string;
    cost_center_id?: string;
    financial_account_id: string;
    amount: number;
    competence_date: string;
    due_date: string;
    payment_date?: string;
    recurrence_type?: RecurrenceType;
    recurrence_interval?: number;
    is_fixed?: boolean;
}
