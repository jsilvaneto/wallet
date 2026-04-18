package com.example.wallet.domain.repository

import com.example.wallet.domain.model.Account
import kotlinx.coroutines.flow.Flow

interface AccountRepository {
    fun getAllAccounts(): Flow<List<Account>>
    suspend fun getAccountById(id: Long): Account?
    suspend fun insertAccount(account: Account)
    suspend fun updateAccount(account: Account)
    suspend fun deleteAccount(account: Account)
}
