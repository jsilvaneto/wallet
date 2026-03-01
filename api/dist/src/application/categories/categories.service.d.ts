import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDto: CreateCategoryDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
    }[]>;
    softDelete(userId: string, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
