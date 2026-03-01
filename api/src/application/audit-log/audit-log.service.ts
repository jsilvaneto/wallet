import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditLogService {
    constructor(private prisma: PrismaService) { }

    async createLog(userId: string, action: string, entity: string, entityId: string, metadata?: any) {
        return this.prisma.auditLog.create({
            data: {
                user_id: userId,
                action,
                entity,
                entity_id: entityId,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            },
        });
    }
}
