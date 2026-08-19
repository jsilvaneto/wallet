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

export interface PaymentMethod {
  id: string;
  profile: ProfileType;
  name: string;
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
  payment_method_id?: string;
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

export type AttachmentType = 
  | "COMPROVANTE" 
  | "NOTA_FISCAL" 
  | "FATURA" 
  | "RECIBO" 
  | "CONTRATO" 
  | "OUTRO";

export interface AttachmentTypeConfig {
  value: AttachmentType;
  label: string;
  shortLabel: string;
  badgeClass: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
  borderLight: string;
  borderDark: string;
  description: string;
}

export const ATTACHMENT_TYPES: Record<AttachmentType, AttachmentTypeConfig> = {
  COMPROVANTE: {
    value: "COMPROVANTE",
    label: "Comprovante de Pagamento / PIX",
    shortLabel: "Comprovante",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    badgeBgLight: "bg-emerald-50",
    badgeBgDark: "dark:bg-emerald-950/50",
    badgeTextLight: "text-emerald-700",
    badgeTextDark: "dark:text-emerald-300",
    borderLight: "border-emerald-200",
    borderDark: "dark:border-emerald-800",
    description: "Comprovante bancário, PIX, TED ou depósito",
  },
  NOTA_FISCAL: {
    value: "NOTA_FISCAL",
    label: "Nota Fiscal / Cupom Fiscal",
    shortLabel: "Nota Fiscal",
    badgeClass: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    badgeBgLight: "bg-purple-50",
    badgeBgDark: "dark:bg-purple-950/50",
    badgeTextLight: "text-purple-700",
    badgeTextDark: "dark:text-purple-300",
    borderLight: "border-purple-200",
    borderDark: "dark:border-purple-800",
    description: "DANFE, NF-e, NFS-e, NFC-e ou cupom",
  },
  FATURA: {
    value: "FATURA",
    label: "Fatura / Boleto Bancário",
    shortLabel: "Fatura / Boleto",
    badgeClass: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    badgeBgLight: "bg-sky-50",
    badgeBgDark: "dark:bg-sky-950/50",
    badgeTextLight: "text-sky-700",
    badgeTextDark: "dark:text-sky-300",
    borderLight: "border-sky-200",
    borderDark: "dark:border-sky-800",
    description: "Fatura de cartão, boleto, conta de consumo",
  },
  RECIBO: {
    value: "RECIBO",
    label: "Recibo de Prestação / Quitação",
    shortLabel: "Recibo",
    badgeClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    badgeBgLight: "bg-amber-50",
    badgeBgDark: "dark:bg-amber-950/50",
    badgeTextLight: "text-amber-700",
    badgeTextDark: "dark:text-amber-300",
    borderLight: "border-amber-200",
    borderDark: "dark:border-amber-800",
    description: "Recibo assinado, RPA ou quitação manual",
  },
  CONTRATO: {
    value: "CONTRATO",
    label: "Contrato / Proposta / Termo",
    shortLabel: "Contrato",
    badgeClass: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    badgeBgLight: "bg-indigo-50",
    badgeBgDark: "dark:bg-indigo-950/50",
    badgeTextLight: "text-indigo-700",
    badgeTextDark: "dark:text-indigo-300",
    borderLight: "border-indigo-200",
    borderDark: "dark:border-indigo-800",
    description: "Contrato de serviço, locação ou proposta",
  },
  OUTRO: {
    value: "OUTRO",
    label: "Outro Documento",
    shortLabel: "Outro",
    badgeClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    badgeBgLight: "bg-zinc-100",
    badgeBgDark: "dark:bg-zinc-800",
    badgeTextLight: "text-zinc-700",
    badgeTextDark: "dark:text-zinc-300",
    borderLight: "border-zinc-200",
    borderDark: "dark:border-zinc-700",
    description: "Documento complementar genérico",
  },
};

export interface Attachment {
  id: string;
  profile: ProfileType;
  transaction_id?: string | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  attachment_type: AttachmentType;
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

