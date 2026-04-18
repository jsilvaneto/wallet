package com.example.wallet.domain.model

import java.time.LocalDateTime

data class PlannedPayment(
    val id: Long? = null,
    val title: String,
    val amount: Double,
    val dueDate: LocalDateTime,
    val categoryId: Long,
    val recurrence: Recurrence,
    val status: PaymentStatus
)

enum class Recurrence {
    NONE, DAILY, WEEKLY, MONTHLY, YEARLY
}

enum class PaymentStatus {
    PENDING, PAID, OVERDUE
}
