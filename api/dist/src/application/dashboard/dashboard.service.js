"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const financialAccounts = await this.prisma.financialAccount.findMany({
            where: { created_by: userId, deleted_at: null },
        });
        const accountsData = await Promise.all(financialAccounts.map(async (acc) => {
            const relatedTransactions = await this.prisma.account.findMany({
                where: {
                    financial_account_id: acc.id,
                    status: client_1.AccountStatus.PAID,
                    deleted_at: null,
                }
            });
            const currentBalance = relatedTransactions.reduce((accBalance, transaction) => {
                const amount = Number(transaction.amount);
                return transaction.type === client_1.TransactionType.INCOME ? accBalance + amount : accBalance - amount;
            }, Number(acc.initial_balance));
            return {
                id: acc.id,
                name: acc.name,
                balance: currentBalance
            };
        }));
        const consolidatedBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);
        const currentMonthAccounts = await this.prisma.account.findMany({
            where: {
                created_by: userId,
                deleted_at: null,
                due_date: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalToPay = currentMonthAccounts
            .filter(a => a.type === client_1.TransactionType.EXPENSE && a.status !== client_1.AccountStatus.PAID)
            .reduce((sum, a) => sum + Number(a.amount), 0);
        const totalToReceive = currentMonthAccounts
            .filter(a => a.type === client_1.TransactionType.INCOME && a.status !== client_1.AccountStatus.PAID)
            .reduce((sum, a) => sum + Number(a.amount), 0);
        const calculateProjection = async (monthsAhead) => {
            const projectionDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, endOfMonth.getDate());
            const futureTransactions = await this.prisma.account.findMany({
                where: {
                    created_by: userId,
                    deleted_at: null,
                    status: { in: [client_1.AccountStatus.PENDING, client_1.AccountStatus.OVERDUE] },
                    due_date: { lte: projectionDate }
                }
            });
            const projectedDelta = futureTransactions.reduce((sum, transaction) => {
                const amount = Number(transaction.amount);
                return transaction.type === client_1.TransactionType.INCOME ? sum + amount : sum - amount;
            }, 0);
            return consolidatedBalance + projectedDelta;
        };
        const projected3Months = await calculateProjection(3);
        const projected6Months = await calculateProjection(6);
        const projected12Months = await calculateProjection(12);
        return {
            consolidatedBalance,
            accountsBalance: accountsData,
            currentMonth: {
                totalToPay,
                totalToReceive
            },
            projections: {
                months3: projected3Months,
                months6: projected6Months,
                months12: projected12Months
            }
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map