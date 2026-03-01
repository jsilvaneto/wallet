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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
let AccountsService = class AccountsService {
    prisma;
    auditLogService;
    constructor(prisma, auditLogService) {
        this.prisma = prisma;
        this.auditLogService = auditLogService;
    }
    determineStatus(paymentDate, dueDate) {
        if (paymentDate)
            return client_1.AccountStatus.PAID;
        if (dueDate && dueDate < new Date() && !paymentDate)
            return client_1.AccountStatus.OVERDUE;
        return client_1.AccountStatus.PENDING;
    }
    async create(userId, createDto) {
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
                recurrence_type: createDto.recurrence_type ?? client_1.RecurrenceType.NONE,
                recurrence_interval: createDto.recurrence_interval,
                is_fixed: createDto.is_fixed ?? false,
                created_by: userId,
            },
        });
        await this.auditLogService.createLog(userId, 'CREATE', 'Account', account.id, { description: account.description });
        if (account.recurrence_type !== client_1.RecurrenceType.NONE) {
            await this.generateRecurrences(userId, account);
        }
        return account;
    }
    async generateRecurrences(userId, baseAccount, limit = 12) {
        const newAccounts = [];
        let currentDueDate = new Date(baseAccount.due_date);
        let currentCompDate = new Date(baseAccount.competence_date);
        for (let i = 1; i <= limit; i++) {
            if (baseAccount.recurrence_type === client_1.RecurrenceType.MONTHLY) {
                currentDueDate.setMonth(currentDueDate.getMonth() + 1);
                currentCompDate.setMonth(currentCompDate.getMonth() + 1);
            }
            else if (baseAccount.recurrence_type === client_1.RecurrenceType.YEARLY) {
                currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
                currentCompDate.setFullYear(currentCompDate.getFullYear() + 1);
            }
            else if (baseAccount.recurrence_type === client_1.RecurrenceType.CUSTOM && baseAccount.recurrence_interval) {
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
                status: client_1.AccountStatus.PENDING,
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
    async findAll(userId) {
        const accounts = await this.prisma.account.findMany({
            where: { created_by: userId, deleted_at: null },
            orderBy: { due_date: 'asc' },
        });
        return Promise.all(accounts.map(async (acc) => {
            let newStatus = this.determineStatus(acc.payment_date, acc.due_date);
            if (newStatus !== acc.status) {
                acc.status = newStatus;
                await this.prisma.account.update({ where: { id: acc.id }, data: { status: newStatus } });
            }
            return acc;
        }));
    }
    async markAsPaid(userId, id, paymentDate) {
        const account = await this.prisma.account.findFirst({ where: { id, created_by: userId, deleted_at: null } });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        const updated = await this.prisma.account.update({
            where: { id },
            data: { payment_date: new Date(paymentDate), status: client_1.AccountStatus.PAID },
        });
        await this.auditLogService.createLog(userId, 'MARK_AS_PAID', 'Account', id);
        return updated;
    }
    async softDelete(userId, id) {
        const account = await this.prisma.account.findFirst({ where: { id, created_by: userId, deleted_at: null } });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        await this.auditLogService.createLog(userId, 'DELETE', 'Account', id);
        return this.prisma.account.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map