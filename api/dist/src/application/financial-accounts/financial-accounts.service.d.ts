import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
export declare class FinancialAccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateFinancialAccountDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    findOne(userId: string, id: string): Promise<any>;
    softDelete(userId: string, id: string): Promise<any>;
}
