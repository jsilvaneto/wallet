import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateCategoryDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    softDelete(userId: string, id: string): Promise<any>;
}
