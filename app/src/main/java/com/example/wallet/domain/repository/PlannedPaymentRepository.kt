package com.example.wallet.domain.repository

import com.example.wallet.domain.model.PlannedPayment
import kotlinx.coroutines.flow.Flow

interface PlannedPaymentRepository {
    fun getAllPlannedPayments(): Flow<List<PlannedPayment>>
    fun getActivePlannedPayments(): Flow<List<PlannedPayment>>
    suspend fun insertPlannedPayment(payment: PlannedPayment)
    suspend fun updatePlannedPayment(payment: PlannedPayment)
    suspend fun deletePlannedPayment(payment: PlannedPayment)
}
