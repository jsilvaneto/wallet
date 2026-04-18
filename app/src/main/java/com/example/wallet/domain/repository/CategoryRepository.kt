package com.example.wallet.domain.repository

import com.example.wallet.domain.model.Category
import kotlinx.coroutines.flow.Flow

interface CategoryRepository {
    fun getAllActiveCategories(): Flow<List<Category>>
    fun getMainCategories(): Flow<List<Category>>
    fun getSubCategories(parentId: Long): Flow<List<Category>>
    suspend fun insertCategory(category: Category)
    suspend fun updateCategory(category: Category)
    suspend fun deleteCategory(category: Category)
}
