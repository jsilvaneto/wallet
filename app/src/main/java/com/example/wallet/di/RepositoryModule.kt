package com.example.wallet.di

import com.example.wallet.data.repository.AccountRepositoryImpl
import com.example.wallet.data.repository.CategoryRepositoryImpl
import com.example.wallet.data.repository.PlannedPaymentRepositoryImpl
import com.example.wallet.data.repository.TransactionRepositoryImpl
import com.example.wallet.domain.repository.AccountRepository
import com.example.wallet.domain.repository.CategoryRepository
import com.example.wallet.domain.repository.PlannedPaymentRepository
import com.example.wallet.domain.repository.TransactionRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindTransactionRepository(
        transactionRepositoryImpl: TransactionRepositoryImpl
    ): TransactionRepository

    @Binds
    @Singleton
    abstract fun bindAccountRepository(
        accountRepositoryImpl: AccountRepositoryImpl
    ): AccountRepository

    @Binds
    @Singleton
    abstract fun bindCategoryRepository(
        categoryRepositoryImpl: CategoryRepositoryImpl
    ): CategoryRepository

    @Binds
    @Singleton
    abstract fun bindPlannedPaymentRepository(
        plannedPaymentRepositoryImpl: PlannedPaymentRepositoryImpl
    ): PlannedPaymentRepository
}
