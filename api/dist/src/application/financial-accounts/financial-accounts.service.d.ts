import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
export declare class FinancialAccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateFinancialAccountDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.FinancialAccountType;
        initial_balance: import("@prisma/client/runtime/library").Decimal;
        created_by: string;
    }>;
    softDelete(userId: string, id: string): Promise<{
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
