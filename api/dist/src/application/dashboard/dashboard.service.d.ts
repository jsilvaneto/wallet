import { PrismaService } from '../../infrastructure/prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardData(userId: string): Promise<{
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
