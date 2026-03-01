import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
export declare class CostCentersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateCostCenterDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    softDelete(userId: string, id: string): Promise<any>;
}
