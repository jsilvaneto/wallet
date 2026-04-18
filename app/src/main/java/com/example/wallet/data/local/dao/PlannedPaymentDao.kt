package com.example.wallet.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.wallet.data.local.entity.PlannedPaymentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PlannedPaymentDao {
    @Query("SELECT * FROM planned_payments ORDER BY dueDate ASC")
    fun getAllPlannedPayments(): Flow<List<PlannedPaymentEntity>>

    @Query("SELECT * FROM planned_payments WHERE status = 'PENDING' OR status = 'OVERDUE' ORDER BY dueDate ASC")
    fun getActivePlannedPayments(): Flow<List<PlannedPaymentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlannedPayment(payment: PlannedPaymentEntity)

    @Update
    suspend fun updatePlannedPayment(payment: PlannedPaymentEntity)

    @Delete
    suspend fun deletePlannedPayment(payment: PlannedPaymentEntity)
}
