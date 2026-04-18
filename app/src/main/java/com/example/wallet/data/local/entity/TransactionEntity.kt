package com.example.wallet.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.example.wallet.domain.model.Transaction
import com.example.wallet.domain.model.TransactionType
import java.time.LocalDateTime

@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(
            entity = CategoryEntity::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.RESTRICT
        ),
        ForeignKey(
            entity = AccountEntity::class,
            parentColumns = ["id"],
            childColumns = ["accountId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("categoryId"), Index("accountId")]
)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val amount: Double,
    val date: LocalDateTime,
    val categoryId: Long,
    val accountId: Long,
    val description: String?,
    val type: TransactionType
)

fun TransactionEntity.toDomain() = Transaction(
    id = if (id == 0L) null else id,
    title = title,
    amount = amount,
    date = date,
    categoryId = categoryId,
    accountId = accountId,
    description = description,
    type = type
)

fun Transaction.toEntity() = TransactionEntity(
    id = id ?: 0L,
    title = title,
    amount = amount,
    date = date,
    categoryId = categoryId,
    accountId = accountId,
    description = description,
    type = type
)
