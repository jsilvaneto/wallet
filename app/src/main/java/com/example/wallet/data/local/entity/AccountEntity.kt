package com.example.wallet.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.wallet.domain.model.Account
import com.example.wallet.domain.model.AccountType

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val balance: Double,
    val type: AccountType,
    val colorHex: String
)

fun AccountEntity.toDomain() = Account(
    id = if (id == 0L) null else id,
    name = name,
    balance = balance,
    type = type,
    colorHex = colorHex
)

fun Account.toEntity() = AccountEntity(
    id = id ?: 0L,
    name = name,
    balance = balance,
    type = type,
    colorHex = colorHex
)
