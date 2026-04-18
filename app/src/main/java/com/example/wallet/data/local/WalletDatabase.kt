package com.example.wallet.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.wallet.data.local.dao.AccountDao
import com.example.wallet.data.local.dao.CategoryDao
import com.example.wallet.data.local.dao.PlannedPaymentDao
import com.example.wallet.data.local.dao.TransactionDao
import com.example.wallet.data.local.entity.AccountEntity
import com.example.wallet.data.local.entity.CategoryEntity
import com.example.wallet.data.local.entity.PlannedPaymentEntity
import com.example.wallet.data.local.entity.TransactionEntity

@Database(
    entities = [
        TransactionEntity::class,
        AccountEntity::class,
        CategoryEntity::class,
        PlannedPaymentEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class WalletDatabase : RoomDatabase() {
    abstract val transactionDao: TransactionDao
    abstract val accountDao: AccountDao
    abstract val categoryDao: CategoryDao
    abstract val plannedPaymentDao: PlannedPaymentDao
}
