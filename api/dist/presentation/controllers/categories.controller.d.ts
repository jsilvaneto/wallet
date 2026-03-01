import { CategoriesService } from '../../application/categories/categories.service';
import { CreateCategoryDto } from '../../application/categories/dto/create-category.dto';
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
    }>;
    findAll(req: any): Promise<{
        id: string;
        created_at: Date;
        name: string;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.TransactionType;
        created_by: string;
    }[]>;
    remove(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
