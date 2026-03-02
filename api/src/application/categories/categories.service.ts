import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                name: createDto.name,
                type: createDto.type,
                parent_id: createDto.parent_id,
                created_by: userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.category.findMany({
            where: { created_by: userId, deleted_at: null, parent_id: null },
            include: {
                sub_categories: {
                    where: { deleted_at: null },
                }
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(userId: string, id: string) {
        const category = await this.prisma.category.findFirst({
            where: { id, created_by: userId, deleted_at: null },
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async update(userId: string, id: string, updateDto: UpdateCategoryDto) {
        const category = await this.findOne(userId, id);
        return this.prisma.category.update({
            where: { id: category.id },
            data: {
                name: updateDto.name !== undefined ? updateDto.name : undefined,
                type: updateDto.type !== undefined ? updateDto.type : undefined,
                parent_id: updateDto.parent_id !== undefined ? updateDto.parent_id : undefined,
            },
        });
    }

    async softDelete(userId: string, id: string) {
        const category = await this.findOne(userId, id);
        return this.prisma.category.update({
            where: { id: category.id },
            data: { deleted_at: new Date() },
        });
    }
}
