import { CostCentersService } from '../../application/cost-centers/cost-centers.service';
import { CreateCostCenterDto } from '../../application/cost-centers/dto/create-cost-center.dto';
export declare class CostCentersController {
    private readonly costCentersService;
    constructor(costCentersService: CostCentersService);
    create(req: any, createDto: CreateCostCenterDto): Promise<any>;
    findAll(req: any): Promise<any>;
    remove(req: any, id: string): Promise<any>;
}
