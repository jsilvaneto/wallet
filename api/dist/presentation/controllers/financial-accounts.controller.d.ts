import { FinancialAccountsService } from '../../application/financial-accounts/financial-accounts.service';
import { CreateFinancialAccountDto } from '../../application/financial-accounts/dto/create-financial-account.dto';
export declare class FinancialAccountsController {
    private readonly financialAccountsService;
    constructor(financialAccountsService: FinancialAccountsService);
    create(req: any, createDto: CreateFinancialAccountDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }>;
    findAll(req: any): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }[]>;
    findOne(req: any, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }>;
}
