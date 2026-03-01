import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';

@Injectable()
export class CostCentersService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDto: CreateCostCenterDto) {
        return this.prisma.costCenter.create({
            data: {
                name: createDto.name,
                created_by: userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.costCenter.findMany({
            where: { created_by: userId, deleted_at: null },
        });
    }

    async softDelete(userId: string, id: string) {
        return this.prisma.costCenter.updateMany({
            where: { id, created_by: userId, deleted_at: null },
            data: { deleted_at: new Date() },
        });
    }
}
