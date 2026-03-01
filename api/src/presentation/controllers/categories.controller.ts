import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from '../../application/categories/categories.service';
import { CreateCategoryDto } from '../../application/categories/dto/create-category.dto';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(@Request() req, @Body() createDto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.categoriesService.findAll(req.user.id);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.categoriesService.softDelete(req.user.id, id);
    }
}
