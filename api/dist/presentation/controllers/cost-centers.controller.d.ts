import { CostCentersService } from '../../application/cost-centers/cost-centers.service';
import { CreateCostCenterDto } from '../../application/cost-centers/dto/create-cost-center.dto';
export declare class CostCentersController {
    private readonly costCentersService;
    constructor(costCentersService: CostCentersService);
    create(req: any, createDto: CreateCostCenterDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string;
    }>;
    findAll(req: any): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string;
    }[]>;
    remove(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
