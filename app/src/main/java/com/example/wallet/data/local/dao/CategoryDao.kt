package com.example.wallet.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.wallet.data.local.entity.CategoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories WHERE isActive = 1 ORDER BY name ASC")
    fun getAllActiveCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE parentCategoryId IS NULL AND isActive = 1")
    fun getMainCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE parentCategoryId = :parentId AND isActive = 1")
    fun getSubCategories(parentId: Long): Flow<List<CategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: CategoryEntity)

    @Update
    suspend fun updateCategory(category: CategoryEntity)

    @Delete
    suspend fun deleteCategory(category: CategoryEntity)
}
