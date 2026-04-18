package com.example.wallet.data.repository

import com.example.wallet.data.local.dao.CategoryDao
import com.example.wallet.data.local.entity.toDomain
import com.example.wallet.data.local.entity.toEntity
import com.example.wallet.domain.model.Category
import com.example.wallet.domain.repository.CategoryRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class CategoryRepositoryImpl @Inject constructor(
    private val dao: CategoryDao
) : CategoryRepository {

    override fun getAllActiveCategories(): Flow<List<Category>> {
        return dao.getAllActiveCategories().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getMainCategories(): Flow<List<Category>> {
        return dao.getMainCategories().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getSubCategories(parentId: Long): Flow<List<Category>> {
        return dao.getSubCategories(parentId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun insertCategory(category: Category) {
        dao.insertCategory(category.toEntity())
    }

    override suspend fun updateCategory(category: Category) {
        dao.updateCategory(category.toEntity())
    }

    override suspend fun deleteCategory(category: Category) {
        dao.deleteCategory(category.toEntity())
    }
}
