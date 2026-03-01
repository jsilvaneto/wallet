import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
export declare class CostCentersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateCostCenterDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string;
    }[]>;
    softDelete(userId: string, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
