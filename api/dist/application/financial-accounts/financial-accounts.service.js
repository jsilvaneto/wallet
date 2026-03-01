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
exports.FinancialAccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let FinancialAccountsService = class FinancialAccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createDto) {
        return this.prisma.financialAccount.create({
            data: {
                name: createDto.name,
                type: createDto.type,
                initial_balance: createDto.initial_balance,
                created_by: userId,
            },
        });
    }
    async findAll(userId) {
        return this.prisma.financialAccount.findMany({
            where: { created_by: userId, deleted_at: null },
        });
    }
    async findOne(userId, id) {
        const account = await this.prisma.financialAccount.findFirst({
            where: { id, created_by: userId, deleted_at: null },
        });
        if (!account)
            throw new common_1.NotFoundException('Financial account not found');
        return account;
    }
    async softDelete(userId, id) {
        const account = await this.findOne(userId, id);
        return this.prisma.financialAccount.update({
            where: { id: account.id },
            data: { deleted_at: new Date() },
        });
    }
    async update(userId, id, updateDto) {
        const account = await this.findOne(userId, id);
        return this.prisma.financialAccount.update({
            where: { id: account.id },
            data: {
                name: updateDto.name !== undefined ? updateDto.name : undefined,
                type: updateDto.type !== undefined ? updateDto.type : undefined,
                initial_balance: updateDto.initial_balance !== undefined ? updateDto.initial_balance : undefined,
            },
        });
    }
};
exports.FinancialAccountsService = FinancialAccountsService;
exports.FinancialAccountsService = FinancialAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialAccountsService);
//# sourceMappingURL=financial-accounts.service.js.map