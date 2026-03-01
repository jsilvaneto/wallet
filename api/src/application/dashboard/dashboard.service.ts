import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TransactionType, AccountStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardData(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Saldo atual por conta financeira
        const financialAccounts = await this.prisma.financialAccount.findMany({
            where: { created_by: userId, deleted_at: null },
        });

        const accountsData = await Promise.all(
            financialAccounts.map(async (acc) => {
                const relatedTransactions = await this.prisma.account.findMany({
                    where: {
                        financial_account_id: acc.id,
                        status: AccountStatus.PAID,
                        deleted_at: null,
                    }
                });

                const currentBalance = relatedTransactions.reduce((accBalance, transaction) => {
                    const amount = Number(transaction.amount);
                    return transaction.type === TransactionType.INCOME ? accBalance + amount : accBalance - amount;
                }, Number(acc.initial_balance));

                return {
                    id: acc.id,
                    name: acc.name,
                    balance: currentBalance
                };
            })
        );

        const consolidatedBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);

        // Total a pagar e receber (mês atual)
        const currentMonthAccounts = await this.prisma.account.findMany({
            where: {
                created_by: userId,
                deleted_at: null,
                due_date: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        const totalToPay = currentMonthAccounts
            .filter(a => a.type === TransactionType.EXPENSE && a.status !== AccountStatus.PAID)
            .reduce((sum, a) => sum + Number(a.amount), 0);

        const totalToReceive = currentMonthAccounts
            .filter(a => a.type === TransactionType.INCOME && a.status !== AccountStatus.PAID)
            .reduce((sum, a) => sum + Number(a.amount), 0);

        // Projeções
        const calculateProjection = async (monthsAhead: number) => {
            const projectionDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, endOfMonth.getDate());

            const futureTransactions = await this.prisma.account.findMany({
                where: {
                    created_by: userId,
                    deleted_at: null,
                    status: { in: [AccountStatus.PENDING, AccountStatus.OVERDUE] },
                    due_date: { lte: projectionDate }
                }
            });

            const projectedDelta = futureTransactions.reduce((sum, transaction) => {
                const amount = Number(transaction.amount);
                return transaction.type === TransactionType.INCOME ? sum + amount : sum - amount;
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
}
