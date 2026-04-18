package com.example.wallet.domain.model

data class Account(
    val id: Long? = null,
    val name: String,
    val balance: Double,
    val type: AccountType,
    val colorHex: String
)

enum class AccountType {
    CASH, BANK, SAVINGS, CREDIT_CARD, OTHER
}
