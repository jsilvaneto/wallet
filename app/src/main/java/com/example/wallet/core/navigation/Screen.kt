package com.example.wallet.core.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object PlannedPayments : Screen("planned_payments", "Planejados", Icons.Default.ReceiptLong)
    object Transactions : Screen("transactions", "Transações", Icons.Default.History)
    object Categories : Screen("categories", "Categorias", Icons.Default.Category)
    object Accounts : Screen("accounts", "Contas", Icons.Default.AccountBalance)
    object Settings : Screen("settings", "Ajustes", Icons.Default.Settings)
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.PlannedPayments,
    Screen.Transactions,
    Screen.Accounts
)
