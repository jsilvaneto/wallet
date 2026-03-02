import { TransactionType } from '@prisma/client';
export declare class UpdateCategoryDto {
    name?: string;
    type?: TransactionType;
    parent_id?: string;
}
