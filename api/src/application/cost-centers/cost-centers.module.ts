import { Module } from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CostCentersController } from '../../presentation/controllers/cost-centers.controller';

@Module({
    controllers: [CostCentersController],
    providers: [CostCentersService],
    exports: [CostCentersService],
})
export class CostCentersModule { }
