import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from '../../application/dashboard/dashboard.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    getDashboardData(@Request() req: any) {
        return this.dashboardService.getDashboardData(req.user.id);
    }
}
