package com.example.wallet.data.local

import androidx.room.TypeConverter
import com.example.wallet.domain.model.AccountType
import com.example.wallet.domain.model.PaymentStatus
import com.example.wallet.domain.model.Recurrence
import com.example.wallet.domain.model.TransactionType
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): LocalDateTime? {
        return value?.let {
            LocalDateTime.ofInstant(Instant.ofEpochMilli(it), ZoneId.systemDefault())
        }
    }

    @TypeConverter
    fun dateToTimestamp(date: LocalDateTime?): Long? {
        return date?.atZone(ZoneId.systemDefault())?.toInstant()?.toEpochMilli()
    }

    @TypeConverter
    fun fromTransactionType(type: TransactionType) = type.name

    @TypeConverter
    fun toTransactionType(value: String) = TransactionType.valueOf(value)

    @TypeConverter
    fun fromAccountType(type: AccountType) = type.name

    @TypeConverter
    fun toAccountType(value: String) = AccountType.valueOf(value)

    @TypeConverter
    fun fromRecurrence(recurrence: Recurrence) = recurrence.name

    @TypeConverter
    fun toRecurrence(value: String) = Recurrence.valueOf(value)

    @TypeConverter
    fun fromPaymentStatus(status: PaymentStatus) = status.name

    @TypeConverter
    fun toPaymentStatus(value: String) = PaymentStatus.valueOf(value)
}
