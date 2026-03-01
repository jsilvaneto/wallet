import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
export declare class AccountsService {
    private prisma;
    private auditLogService;
    constructor(prisma: PrismaService, auditLogService: AuditLogService);
    private determineStatus;
    create(userId: string, createDto: CreateAccountDto): Promise<any>;
    private generateRecurrences;
    findAll(userId: string): Promise<any>;
    markAsPaid(userId: string, id: string, paymentDate: string): Promise<any>;
    softDelete(userId: string, id: string): Promise<any>;
}
