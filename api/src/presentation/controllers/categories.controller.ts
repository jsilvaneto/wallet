import { Controller, Post, Body, Get, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from '../../application/categories/categories.service';
import { CreateCategoryDto } from '../../application/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../application/categories/dto/update-category.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(@Request() req: any, @Body() createDto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.categoriesService.findAll(req.user.id);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.categoriesService.softDelete(req.user.id, id);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
        return this.categoriesService.update(req.user.id, id, updateDto);
    }
}
