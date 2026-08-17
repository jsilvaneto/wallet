-- ========================================================
-- WALLET DATABASE SCHEMA (SQLite WAL)
-- Consolidated Tables, Constraints and Indexes
-- ========================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE accounts (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	type VARCHAR(30) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_account_profile CHECK (profile IN ('PESSOAL', 'EMPRESA'))
);

CREATE TABLE categories (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	type VARCHAR(10) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	nature VARCHAR(20) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_category_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_category_type CHECK (type IN ('RECEITA', 'DESPESA')), 
	CONSTRAINT chk_category_nature CHECK (nature IN ('NENHUM', 'OBRIGATORIO', 'NECESSARIO', 'DESEJO'))
);

CREATE TABLE contacts (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	type VARCHAR(20) NOT NULL, 
	document VARCHAR(30), 
	notes TEXT, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_contact_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_contact_type CHECK (type IN ('FORNECEDOR', 'CLIENTE', 'FUNCIONARIO', 'OUTRO'))
);

CREATE TABLE goals (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	target_amount_cents INTEGER NOT NULL, 
	current_amount_cents INTEGER NOT NULL, 
	target_date VARCHAR(10), 
	status VARCHAR(20) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_goal_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_goal_status CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'))
);

CREATE TABLE sync_logs (
	id VARCHAR(36) NOT NULL, 
	action VARCHAR(20) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	items_imported INTEGER NOT NULL, 
	items_exported INTEGER NOT NULL, 
	message TEXT NOT NULL, 
	details TEXT, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE system_configs (
	key VARCHAR(100) NOT NULL, 
	value TEXT, 
	updated_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (key)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	username VARCHAR(50) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE budgets (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	month INTEGER NOT NULL, 
	year INTEGER NOT NULL, 
	limit_amount_cents INTEGER NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_budget_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_budget_month CHECK (month BETWEEN 1 AND 12), 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE TABLE debts (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	contact_id VARCHAR(36), 
	title VARCHAR(150) NOT NULL, 
	total_amount_cents INTEGER NOT NULL, 
	remaining_amount_cents INTEGER NOT NULL, 
	due_date VARCHAR(10), 
	status VARCHAR(20) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_debt_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_debt_status CHECK (status IN ('ATIVA', 'QUITADA', 'CANCELADA')), 
	FOREIGN KEY(contact_id) REFERENCES contacts (id) ON DELETE SET NULL
);

CREATE TABLE items (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	default_amount_cents INTEGER, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_item_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE schedules (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	type VARCHAR(10) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	item_id VARCHAR(36), 
	contact_id VARCHAR(36), 
	debt_id VARCHAR(36), 
	description VARCHAR(255) NOT NULL, 
	schedule_type VARCHAR(30) NOT NULL, 
	frequency VARCHAR(20) NOT NULL, 
	amount_cents INTEGER NOT NULL, 
	total_installments INTEGER, 
	start_date VARCHAR(10) NOT NULL, 
	due_day INTEGER NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	created_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_schedule_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_schedule_type CHECK (type IN ('RECEITA', 'DESPESA')), 
	CONSTRAINT chk_schedule_kind CHECK (schedule_type IN ('RECORRENTE_CONTINUA', 'PARCELADA')), 
	CONSTRAINT chk_schedule_freq CHECK (frequency IN ('SEMANAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')), 
	CONSTRAINT chk_schedule_day CHECK (due_day BETWEEN 1 AND 31), 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT, 
	FOREIGN KEY(item_id) REFERENCES items (id) ON DELETE SET NULL, 
	FOREIGN KEY(contact_id) REFERENCES contacts (id) ON DELETE SET NULL, 
	FOREIGN KEY(debt_id) REFERENCES debts (id) ON DELETE SET NULL
);

CREATE TABLE transactions (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	type VARCHAR(10) NOT NULL, 
	account_id VARCHAR(36), 
	category_id VARCHAR(36) NOT NULL, 
	item_id VARCHAR(36), 
	contact_id VARCHAR(36), 
	debt_id VARCHAR(36), 
	schedule_id VARCHAR(36), 
	installment_number INTEGER, 
	total_installments INTEGER, 
	description VARCHAR(255) NOT NULL, 
	amount_cents INTEGER NOT NULL, 
	due_date VARCHAR(10) NOT NULL, 
	payment_date VARCHAR(10), 
	status VARCHAR(20) NOT NULL, 
	sync_status VARCHAR(20) NOT NULL, 
	notes TEXT, 
	created_at VARCHAR(30) NOT NULL, 
	updated_at VARCHAR(30) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_trans_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_trans_type CHECK (type IN ('RECEITA', 'DESPESA')), 
	CONSTRAINT chk_trans_status CHECK (status IN ('PENDENTE', 'CONCLUIDO', 'CANCELADO')), 
	CONSTRAINT chk_trans_sync CHECK (sync_status IN ('PENDENTE', 'SINCRONIZADO')), 
	FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE SET NULL, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT, 
	FOREIGN KEY(item_id) REFERENCES items (id) ON DELETE SET NULL, 
	FOREIGN KEY(contact_id) REFERENCES contacts (id) ON DELETE SET NULL, 
	FOREIGN KEY(debt_id) REFERENCES debts (id) ON DELETE SET NULL, 
	FOREIGN KEY(schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
);

CREATE TABLE attachments (
	id VARCHAR(36) NOT NULL, 
	profile VARCHAR(10) NOT NULL, 
	transaction_id VARCHAR(36), 
	file_name VARCHAR(255) NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	file_size_bytes INTEGER NOT NULL, 
	mime_type VARCHAR(100) NOT NULL, 
	drive_file_id VARCHAR(100), 
	drive_web_view_link TEXT, 
	drive_folder_id VARCHAR(100), 
	sync_status VARCHAR(20) NOT NULL, 
	sync_error TEXT, 
	created_at VARCHAR(30) NOT NULL, 
	synced_at VARCHAR(30), 
	PRIMARY KEY (id), 
	CONSTRAINT chk_attachment_profile CHECK (profile IN ('PESSOAL', 'EMPRESA')), 
	CONSTRAINT chk_attachment_sync_status CHECK (sync_status IN ('PENDENTE', 'SINCRONIZADO', 'ERRO', 'LOCAL_ONLY')), 
	FOREIGN KEY(transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_users_username ON users (username);

CREATE INDEX idx_trans_sync ON transactions (sync_status);

CREATE INDEX idx_trans_status ON transactions (status);

CREATE INDEX idx_trans_profile_due ON transactions (profile, due_date);

CREATE INDEX idx_attachment_profile ON attachments (profile);

CREATE INDEX idx_attachment_sync ON attachments (sync_status);

CREATE INDEX idx_attachment_transaction ON attachments (transaction_id);
