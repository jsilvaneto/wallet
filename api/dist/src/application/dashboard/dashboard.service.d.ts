import { PrismaService } from '../../infrastructure/prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardData(userId: string): Promise<{
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
