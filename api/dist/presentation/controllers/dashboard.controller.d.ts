import { DashboardService } from '../../application/dashboard/dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(req: any): Promise<{
        consolidatedBalance: number;
        accountsBalance: {
            id: string;
            name: string;
            balance: number;
        }[];
        currentMonth: {
            totalToPay: number;
            totalToReceive: number;
        };
        projections: {
            months3: number;
            months6: number;
            months12: number;
        };
    }>;
}
