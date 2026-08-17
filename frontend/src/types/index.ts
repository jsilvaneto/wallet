export type ProfileType = "PESSOAL" | "EMPRESA";
export type TransactionType = "RECEITA" | "DESPESA";
export type TransactionStatus = "PENDENTE" | "CONCLUIDO" | "CANCELADO";
export type CategoryNature = "NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO";

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export type AccountType = "CORRENTE" | "POUPANCA" | "INVESTIMENTO" | "CAIXA" | "OUTRO";

export interface Account {
  id: string;
  profile: ProfileType;
  name: string;
  type: AccountType;
  created_at: string;
}

export interface Category {
  id: string;
  profile: ProfileType;
  type: TransactionType;
  name: string;
  nature: CategoryNature;
  created_at: string;
}

export interface Item {
  id: string;
  profile: ProfileType;
  category_id: string;
  name: string;
  default_amount_cents?: number | null;
  category_name?: string | null;
  category_type?: TransactionType | null;
  category_nature?: CategoryNature | null;
  created_at: string;
}

export interface Contact {
  id: string;
  profile: ProfileType;
  name: string;
  type: "FORNECEDOR" | "CLIENTE" | "FUNCIONARIO" | "OUTRO";
  document?: string;
  notes?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  profile: ProfileType;
  contact_id?: string;
  title: string;
  total_amount_cents: number;
  remaining_amount_cents: number;
  due_date?: string;
  status: "ATIVA" | "QUITADA" | "CANCELADA";
  created_at: string;
}

export interface Budget {
  id: string;
  profile: ProfileType;
  category_id: string;
  category_name?: string;
  month: number;
  year: number;
  limit_amount_cents: number;
  spent_amount_cents: number;
  remaining_amount_cents: number;
  percentage_used: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  profile: ProfileType;
  type: TransactionType;
  account_id?: string;
  category_id: string;
  item_id?: string;
  contact_id?: string;
  debt_id?: string;
  schedule_id?: string;
  installment_number?: number;
  total_installments?: number;
  description: string;
  amount_cents: number;
  due_date: string;
  payment_date?: string;
  status: TransactionStatus;
  sync_status: "PENDENTE" | "SINCRONIZADO";
  notes?: string;
  created_at: string;
  attachments?: Attachment[];
  attachments_count?: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  amount_cents: number;
  percentage: number;
}

export interface DashboardSummary {
  profile: ProfileType;
  month: number;
  year: number;
  income_realized_cents: number;
  expense_realized_cents: number;
  net_realized_cents: number;
  income_pending_cents: number;
  expense_pending_cents: number;
  net_pending_cents: number;
  projected_net_cents: number;
  overdue_count: number;
  overdue_amount_cents: number;
  due_today_count: number;
  due_today_amount_cents: number;
  top_expense_categories: CategoryBreakdown[];
}

export interface SyncConfig {
  spreadsheet_id?: string | null;
  spreadsheet_url?: string | null;
  has_credentials: boolean;
  service_account_email?: string | null;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_action?: string | null;
}

export interface SyncLog {
  id: string;
  action: "EXPORT" | "IMPORT" | "FULL" | "TEST";
  status: "SUCESSO" | "ERRO" | "EM_ANDAMENTO";
  items_imported: number;
  items_exported: number;
  message: string;
  details?: string | null;
  created_at: string;
}

export interface SyncTestResult {
  success: boolean;
  message: string;
  spreadsheet_title?: string | null;
  sheets_found?: string[];
  service_account_email?: string | null;
}

export interface SyncResultResponse {
  success: boolean;
  message: string;
  imported_from_queue: number;
  exported_to_mirror: number;
  entity_counts?: {
    transacoes?: number;
    categorias?: number;
    itens?: number;
    contas?: number;
    contatos?: number;
    dividas?: number;
    orcamentos?: number;
    [key: string]: number | undefined;
  };
  errors?: string[];
}

export interface SyncPendingDetails {
  pending_transactions: number;
  pending_categories: number;
  pending_items: number;
  pending_accounts: number;
  pending_contacts: number;
  pending_debts: number;
  pending_budgets: number;
  pending_attachments: number;
  queue_rows: number;
}

export interface SyncStatus {
  is_configured: boolean;
  has_credentials: boolean;
  spreadsheet_id?: string | null;
  spreadsheet_url?: string | null;
  service_account_email?: string | null;
  pending_send: number;
  pending_receive: number;
  total_pending: number;
  has_pending: boolean;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_action?: string | null;
  details?: SyncPendingDetails | null;
}

export interface Attachment {
  id: string;
  profile: ProfileType;
  transaction_id?: string | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  drive_file_id?: string | null;
  drive_web_view_link?: string | null;
  drive_folder_id?: string | null;
  sync_status: "PENDENTE" | "SINCRONIZADO" | "ERRO" | "LOCAL_ONLY";
  sync_error?: string | null;
  created_at: string;
  synced_at?: string | null;
  download_url?: string;
  file_url?: string;
  formatted_size?: string;
}

export interface AttachmentStats {
  total_count: number;
  total_size_bytes: number;
  formatted_total_size: string;
  active_directory: string;
  default_directory: string;
  is_custom_directory: boolean;
  is_writable: boolean;
  free_space_bytes?: number | null;
  formatted_free_space?: string | null;
  synced_count: number;
  pending_count: number;
  error_count: number;
}

export interface StorageDirectoryConfigResponse {
  active_directory: string;
  default_directory: string;
  is_custom: boolean;
  is_writable: boolean;
  free_space_bytes?: number | null;
  formatted_free_space?: string | null;
  migrated_count: number;
  message: string;
}

