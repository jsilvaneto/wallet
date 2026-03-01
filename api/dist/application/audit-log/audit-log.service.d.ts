import { PrismaService } from '../../infrastructure/prisma/prisma.service';
export declare class AuditLogService {
    private prisma;
    constructor(prisma: PrismaService);
    createLog(userId: string, action: string, entity: string, entityId: string, metadata?: any): Promise<{
        id: string;
        action: string;
        entity: string;
        entity_id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
        user_id: string;
    }>;
}
