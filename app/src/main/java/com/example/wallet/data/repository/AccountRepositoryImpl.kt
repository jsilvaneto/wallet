package com.example.wallet.data.repository

import com.example.wallet.data.local.dao.AccountDao
import com.example.wallet.data.local.entity.toDomain
import com.example.wallet.data.local.entity.toEntity
import com.example.wallet.domain.model.Account
import com.example.wallet.domain.repository.AccountRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class AccountRepositoryImpl @Inject constructor(
    private val dao: AccountDao
) : AccountRepository {

    override fun getAllAccounts(): Flow<List<Account>> {
        return dao.getAllAccounts().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun getAccountById(id: Long): Account? {
        return dao.getAccountById(id)?.toDomain()
    }

    override suspend fun insertAccount(account: Account) {
        dao.insertAccount(account.toEntity())
    }

    override suspend fun updateAccount(account: Account) {
        dao.updateAccount(account.toEntity())
    }

    override suspend fun deleteAccount(account: Account) {
        dao.deleteAccount(account.toEntity())
    }
}
