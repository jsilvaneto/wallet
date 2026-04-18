package com.example.wallet.data.repository

import com.example.wallet.data.local.dao.PlannedPaymentDao
import com.example.wallet.data.local.entity.toDomain
import com.example.wallet.data.local.entity.toEntity
import com.example.wallet.domain.model.PlannedPayment
import com.example.wallet.domain.repository.PlannedPaymentRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class PlannedPaymentRepositoryImpl @Inject constructor(
    private val dao: PlannedPaymentDao
) : PlannedPaymentRepository {

    override fun getAllPlannedPayments(): Flow<List<PlannedPayment>> {
        return dao.getAllPlannedPayments().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getActivePlannedPayments(): Flow<List<PlannedPayment>> {
        return dao.getActivePlannedPayments().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun insertPlannedPayment(payment: PlannedPayment) {
        dao.insertPlannedPayment(payment.toEntity())
    }

    override suspend fun updatePlannedPayment(payment: PlannedPayment) {
        dao.updatePlannedPayment(payment.toEntity())
    }

    override suspend fun deletePlannedPayment(payment: PlannedPayment) {
        dao.deletePlannedPayment(payment.toEntity())
    }
}
