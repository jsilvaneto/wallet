import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';

@Injectable()
export class FinancialAccountsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDto: CreateFinancialAccountDto) {
        return this.prisma.financialAccount.create({
            data: {
                name: createDto.name,
                type: createDto.type,
                initial_balance: createDto.initial_balance,
                created_by: userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.financialAccount.findMany({
            where: { created_by: userId, deleted_at: null },
        });
    }

    async findOne(userId: string, id: string) {
        const account = await this.prisma.financialAccount.findFirst({
            where: { id, created_by: userId, deleted_at: null },
        });
        if (!account) throw new NotFoundException('Financial account not found');
        return account;
    }

    async softDelete(userId: string, id: string) {
        const account = await this.findOne(userId, id);
        return this.prisma.financialAccount.update({
            where: { id: account.id },
            data: { deleted_at: new Date() },
        });
    }

    async update(userId: string, id: string, updateDto: UpdateFinancialAccountDto) {
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
}
