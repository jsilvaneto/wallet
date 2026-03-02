import { CategoriesService } from '../../application/categories/categories.service';
import { CreateCategoryDto } from '../../application/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../application/categories/dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(req: any, createDto: CreateCategoryDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    }>;
    findAll(req: any): Promise<({
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
    remove(req: any, id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
        parent_id: string | null;
    }>;
    update(req: any, id: string, updateDto: UpdateCategoryDto): Promise<{
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
