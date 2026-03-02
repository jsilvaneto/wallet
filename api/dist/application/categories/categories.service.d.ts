import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
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
        parent_id: string | null;
    }>;
    findAll(userId: string): Promise<({
        sub_categories: {
            id: string;
            created_at: Date;
            name: string;
            updated_at: Date;
            deleted_at: Date | null;
            type: import(".prisma/client").$Enums.TransactionType;
            created_by: string;
            parent_id: string | null;
        }[];
    } & {
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    })[]>;
    findOne(userId: string, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    }>;
    update(userId: string, id: string, updateDto: UpdateCategoryDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    }>;
    softDelete(userId: string, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    }>;
}
