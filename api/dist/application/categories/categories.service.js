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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createDto) {
        return this.prisma.category.create({
            data: {
                name: createDto.name,
                type: createDto.type,
                parent_id: createDto.parent_id,
                created_by: userId,
            },
        });
    }
    async findAll(userId) {
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
    async findOne(userId, id) {
        const category = await this.prisma.category.findFirst({
            where: { id, created_by: userId, deleted_at: null },
        });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        return category;
    }
    async update(userId, id, updateDto) {
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
    async softDelete(userId, id) {
        const category = await this.findOne(userId, id);
        return this.prisma.category.update({
            where: { id: category.id },
            data: { deleted_at: new Date() },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map