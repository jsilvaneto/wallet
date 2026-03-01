import { DashboardService } from '../../application/dashboard/dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(req: any): Promise<{
        consolidatedBalance: any;
        accountsBalance: any;
        currentMonth: {
            totalToPay: any;
            totalToReceive: any;
        };
        projections: {
            months3: any;
            months6: any;
            months12: any;
        };
    }>;
}
