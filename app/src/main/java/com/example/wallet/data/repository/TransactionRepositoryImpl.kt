package com.example.wallet.data.repository

import com.example.wallet.data.local.dao.TransactionDao
import com.example.wallet.data.local.entity.toDomain
import com.example.wallet.data.local.entity.toEntity
import com.example.wallet.domain.model.Transaction
import com.example.wallet.domain.repository.TransactionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class TransactionRepositoryImpl @Inject constructor(
    private val dao: TransactionDao
) : TransactionRepository {

    override fun getAllTransactions(): Flow<List<Transaction>> {
        return dao.getAllTransactions().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun insertTransaction(transaction: Transaction) {
        dao.insertTransaction(transaction.toEntity())
    }

    override suspend fun updateTransaction(transaction: Transaction) {
        dao.updateTransaction(transaction.toEntity())
    }

    override suspend fun deleteTransaction(transaction: Transaction) {
        dao.deleteTransaction(transaction.toEntity())
    }
}
