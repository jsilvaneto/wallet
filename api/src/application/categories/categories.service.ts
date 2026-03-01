import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                name: createDto.name,
                type: createDto.type,
                created_by: userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.category.findMany({
            where: { created_by: userId, deleted_at: null },
        });
    }

    async softDelete(userId: string, id: string) {
        return this.prisma.category.updateMany({
            where: { id, created_by: userId, deleted_at: null },
            data: { deleted_at: new Date() },
        });
    }
}
