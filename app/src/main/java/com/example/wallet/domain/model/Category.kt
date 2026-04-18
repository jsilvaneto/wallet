package com.example.wallet.domain.model

data class Category(
    val id: Long? = null,
    val name: String,
    val iconName: String, // Nome do ícone do Material Icons
    val colorHex: String,
    val parentCategoryId: Long? = null, // Para estrutura hierárquica
    val isActive: Boolean = true
)
