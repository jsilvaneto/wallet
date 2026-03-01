import { CategoriesService } from '../../application/categories/categories.service';
import { CreateCategoryDto } from '../../application/categories/dto/create-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(req: any, createDto: CreateCategoryDto): Promise<any>;
    findAll(req: any): Promise<any>;
    remove(req: any, id: string): Promise<any>;
}
