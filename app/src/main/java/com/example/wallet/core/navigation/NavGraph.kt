package com.example.wallet.core.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun NavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Dashboard.route
    ) {
        composable(Screen.Dashboard.route) {
            PlaceholderScreen(Screen.Dashboard.title)
        }
        composable(Screen.PlannedPayments.route) {
            PlaceholderScreen(Screen.PlannedPayments.title)
        }
        composable(Screen.Transactions.route) {
            PlaceholderScreen(Screen.Transactions.title)
        }
        composable(Screen.Accounts.route) {
            PlaceholderScreen(Screen.Accounts.title)
        }
        composable(Screen.Categories.route) {
            PlaceholderScreen(Screen.Categories.title)
        }
        composable(Screen.Settings.route) {
            PlaceholderScreen(Screen.Settings.title)
        }
    }
}

@Composable
fun PlaceholderScreen(title: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Tela: $title")
    }
}
