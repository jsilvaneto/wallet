# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created initial NestJS project structure.
- Docker environment (Dockerfile + docker-compose with PostgreSQL).
- Prisma ORM initialization and schema definition for exactly 6 entities (users, financial_accounts, categories, cost_centers, accounts, audit_logs).
- Global exception filter and Logger interceptor.
- RBAC Architecture (RolesGuard, JwtAuthGuard).
- Financial modules: FinancialAccounts, Categories, CostCenters, Accounts.
- Accounts dynamic statuses and automated recurrent generation.
- Dashboard with total metrics and 3, 6, 12 months balance projections.
- Auto JWT generation and Bcrypt password hashing.
