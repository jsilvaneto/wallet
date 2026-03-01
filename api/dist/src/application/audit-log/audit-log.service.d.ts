import { PrismaService } from '../../infrastructure/prisma/prisma.service';
export declare class AuditLogService {
    private prisma;
    constructor(prisma: PrismaService);
    createLog(userId: string, action: string, entity: string, entityId: string, metadata?: any): Promise<any>;
}
