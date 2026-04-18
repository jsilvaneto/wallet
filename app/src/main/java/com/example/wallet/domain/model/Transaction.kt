package com.example.wallet.domain.model

import java.time.LocalDateTime

data class Transaction(
    val id: Long? = null,
    val title: String,
    val amount: Double,
    val date: LocalDateTime,
    val categoryId: Long,
    val accountId: Long,
    val description: String? = null,
    val type: TransactionType
)

enum class TransactionType {
    INCOME, EXPENSE
}
