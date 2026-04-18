package com.example.wallet.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.wallet.domain.model.Category

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val iconName: String,
    val colorHex: String,
    val parentCategoryId: Long? = null,
    val isActive: Boolean = true
)

fun CategoryEntity.toDomain() = Category(
    id = if (id == 0L) null else id,
    name = name,
    iconName = iconName,
    colorHex = colorHex,
    parentCategoryId = parentCategoryId,
    isActive = isActive
)

fun Category.toEntity() = CategoryEntity(
    id = id ?: 0L,
    name = name,
    iconName = iconName,
    colorHex = colorHex,
    parentCategoryId = parentCategoryId,
    isActive = isActive
)
