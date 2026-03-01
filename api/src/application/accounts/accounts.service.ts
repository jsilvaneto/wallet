import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountStatus, TransactionType, RecurrenceType } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AccountsService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) { }

    private determineStatus(paymentDate?: Date | null, dueDate?: Date): AccountStatus {
        if (paymentDate) return AccountStatus.PAID;
        if (dueDate && dueDate < new Date() && !paymentDate) return AccountStatus.OVERDUE;
        return AccountStatus.PENDING;
    }

    async create(userId: string, createDto: CreateAccountDto) {
        const competenceDate = new Date(createDto.competence_date);
        const dueDate = new Date(createDto.due_date);
        const paymentDate = createDto.payment_date ? new Date(createDto.payment_date) : null;

        let status = this.determineStatus(paymentDate, dueDate);

        const account = await this.prisma.account.create({
            data: {
                description: createDto.description,
                type: createDto.type,
                category_id: createDto.category_id,
                cost_center_id: createDto.cost_center_id,
                financial_account_id: createDto.financial_account_id,
                amount: createDto.amount,
                competence_date: competenceDate,
                due_date: dueDate,
                payment_date: paymentDate,
                status,
                recurrence_type: createDto.recurrence_type ?? RecurrenceType.NONE,
                recurrence_interval: createDto.recurrence_interval,
                is_fixed: createDto.is_fixed ?? false,
                created_by: userId,
            },
        });

        await this.auditLogService.createLog(userId, 'CREATE', 'Account', account.id, { description: account.description });

        if (account.recurrence_type !== RecurrenceType.NONE) {
            await this.generateRecurrences(userId, account);
        }

        return account;
    }

    private async generateRecurrences(userId: string, baseAccount: any, limit: number = 12) {
        const newAccounts = [];
        let currentDueDate = new Date(baseAccount.due_date);
        let currentCompDate = new Date(baseAccount.competence_date);

        for (let i = 1; i <= limit; i++) {
            if (baseAccount.recurrence_type === RecurrenceType.MONTHLY) {
                currentDueDate.setMonth(currentDueDate.getMonth() + 1);
                currentCompDate.setMonth(currentCompDate.getMonth() + 1);
            } else if (baseAccount.recurrence_type === RecurrenceType.YEARLY) {
                currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
                currentCompDate.setFullYear(currentCompDate.getFullYear() + 1);
            } else if (baseAccount.recurrence_type === RecurrenceType.CUSTOM && baseAccount.recurrence_interval) {
                currentDueDate.setDate(currentDueDate.getDate() + baseAccount.recurrence_interval);
                currentCompDate.setDate(currentCompDate.getDate() + baseAccount.recurrence_interval);
            }

            newAccounts.push({
                description: `${baseAccount.description} (Recorrente ${i})`,
                type: baseAccount.type,
                category_id: baseAccount.category_id,
                cost_center_id: baseAccount.cost_center_id,
                financial_account_id: baseAccount.financial_account_id,
                amount: baseAccount.amount,
                competence_date: new Date(currentCompDate),
                due_date: new Date(currentDueDate),
                status: AccountStatus.PENDING,
                recurrence_type: baseAccount.recurrence_type,
                recurrence_interval: baseAccount.recurrence_interval,
                is_fixed: baseAccount.is_fixed,
                created_by: userId,
            });
        }

        if (newAccounts.length > 0) {
            await this.prisma.account.createMany({ data: newAccounts });
            await this.auditLogService.createLog(userId, 'GENERATE_RECURRENCE', 'Account', baseAccount.id, { count: newAccounts.length });
        }
    }

    async findAll(userId: string) {
        const accounts = await this.prisma.account.findMany({
            where: { created_by: userId, deleted_at: null },
            orderBy: { due_date: 'asc' },
        });

        // Dynamically update rules
        return Promise.all(accounts.map(async acc => {
            let newStatus = this.determineStatus(acc.payment_date, acc.due_date);
            if (newStatus !== acc.status) {
                acc.status = newStatus;
                await this.prisma.account.update({ where: { id: acc.id }, data: { status: newStatus } });
            }
            return acc;
        }));
    }

    async markAsPaid(userId: string, id: string, paymentDate: string) {
        const account = await this.prisma.account.findFirst({ where: { id, created_by: userId, deleted_at: null } });
        if (!account) throw new NotFoundException('Account not found');

        const updated = await this.prisma.account.update({
            where: { id },
            data: { payment_date: new Date(paymentDate), status: AccountStatus.PAID },
        });

        await this.auditLogService.createLog(userId, 'MARK_AS_PAID', 'Account', id);
        return updated;
    }

    async softDelete(userId: string, id: string) {
        const account = await this.prisma.account.findFirst({ where: { id, created_by: userId, deleted_at: null } });
        if (!account) throw new NotFoundException('Account not found');

        await this.auditLogService.createLog(userId, 'DELETE', 'Account', id);
        return this.prisma.account.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }
}
