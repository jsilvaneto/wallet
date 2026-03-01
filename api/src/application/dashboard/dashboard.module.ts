import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from '../../presentation/controllers/dashboard.controller';

@Module({
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }
