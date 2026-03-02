import { TransactionType } from '@prisma/client';
export declare class CreateCategoryDto {
    name: string;
    type: TransactionType;
    parent_id?: string;
}
