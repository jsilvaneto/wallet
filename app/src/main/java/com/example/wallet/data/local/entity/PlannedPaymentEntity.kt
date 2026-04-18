package com.example.wallet.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.example.wallet.domain.model.PaymentStatus
import com.example.wallet.domain.model.PlannedPayment
import com.example.wallet.domain.model.Recurrence
import java.time.LocalDateTime

@Entity(
    tableName = "planned_payments",
    foreignKeys = [
        ForeignKey(
            entity = CategoryEntity::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("categoryId")]
)
data class PlannedPaymentEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val amount: Double,
    val dueDate: LocalDateTime,
    val categoryId: Long,
    val recurrence: Recurrence,
    val status: PaymentStatus
)

fun PlannedPaymentEntity.toDomain() = PlannedPayment(
    id = if (id == 0L) null else id,
    title = title,
    amount = amount,
    dueDate = dueDate,
    categoryId = categoryId,
    recurrence = recurrence,
    status = status
)

fun PlannedPayment.toEntity() = PlannedPaymentEntity(
    id = id ?: 0L,
    title = title,
    amount = amount,
    dueDate = dueDate,
    categoryId = categoryId,
    recurrence = recurrence,
    status = status
)
