package com.example.wallet.di

import android.content.Context
import androidx.room.Room
import com.example.wallet.data.local.WalletDatabase
import com.example.wallet.data.local.dao.AccountDao
import com.example.wallet.data.local.dao.CategoryDao
import com.example.wallet.data.local.dao.PlannedPaymentDao
import com.example.wallet.data.local.dao.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideWalletDatabase(
        @ApplicationContext context: Context
    ): WalletDatabase {
        return Room.databaseBuilder(
            context,
            WalletDatabase::class.java,
            "wallet_db"
        ).build()
    }

    @Provides
    fun provideTransactionDao(db: WalletDatabase): TransactionDao = db.transactionDao

    @Provides
    fun provideAccountDao(db: WalletDatabase): AccountDao = db.accountDao

    @Provides
    fun provideCategoryDao(db: WalletDatabase): CategoryDao = db.categoryDao

    @Provides
    fun providePlannedPaymentDao(db: WalletDatabase): PlannedPaymentDao = db.plannedPaymentDao
}
