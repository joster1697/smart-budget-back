// Tipos de dominio compartidos del agente de IA.
// Consumidos por ingestion.service, channel-processor, action-executor y controllers.

export interface CategoryContext {
  id: string;
  name: string;
}

export interface AccountContext {
  id: string;
  name: string;
  type: string;
}

export const VALID_INTENTS = [
  'CREATE_TRANSACTION',
  'UPDATE_TRANSACTION',
  'DELETE_TRANSACTION',
  'CREATE_ACCOUNT',
  'UPDATE_ACCOUNT',
  'DELETE_ACCOUNT',
  'CREATE_CATEGORY',
  'UPDATE_CATEGORY',
  'DELETE_CATEGORY',
  'QUERY',
  'GREETING',
] as const;

export type AgentIntent = typeof VALID_INTENTS[number];

// ─── Transaction payloads ────────────────────────────────────────────────────

export interface TransactionSearchCriteria {
  description?: string;
  merchant?: string;
  date?: string;
}

export interface CreatePayload {
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  merchant: string | null;
  account_id: string | null;
  account_name: string | null;
  category_id: string | null;
  category_name: string | null;
  date: string;
  description: string;
  notes: string;
  confidence: number;
}

export interface UpdatePayload {
  search: TransactionSearchCriteria;
  changes: {
    amount?: number;
    currency?: string;
    merchant?: string;
    category_id?: string;
    category_name?: string;
    date?: string;
    description?: string;
  };
  confidence: number;
}

export interface DeletePayload {
  search: TransactionSearchCriteria;
  confidence: number;
}

// ─── Account payloads ────────────────────────────────────────────────────────

export interface AccountSearchCriteria {
  name?: string;
  type?: string;
}

export interface CreateAccountPayload {
  name: string;
  type: string;
  balance: number;
  currency: string;
  confidence: number;
}

export interface UpdateAccountPayload {
  search: AccountSearchCriteria;
  changes: {
    name?: string;
    type?: string;
    balance?: number;
  };
  confidence: number;
}

export interface DeleteAccountPayload {
  search: AccountSearchCriteria;
  confidence: number;
}

// ─── Category payloads ───────────────────────────────────────────────────────

export interface CategorySearchCriteria {
  name?: string;
}

export interface CreateCategoryPayload {
  name: string;
  confidence: number;
}

export interface UpdateCategoryPayload {
  search: CategorySearchCriteria;
  changes: {
    name: string;
  };
  confidence: number;
}

export interface DeleteCategoryPayload {
  search: CategorySearchCriteria;
  confidence: number;
}

// ─── Query payloads ──────────────────────────────────────────────────────────

export type QueryType =
  | 'LIST_TRANSACTIONS'
  | 'LIST_ACCOUNTS'
  | 'LIST_CATEGORIES'
  | 'ACCOUNT_BALANCE'
  | 'ACCOUNT_STATEMENT'
  | 'SPENDING_SUMMARY';

export interface QueryFilters {
  date_from?: string;
  date_to?: string;
  account_name?: string;
  account_id?: string;
  category_name?: string;
  category_id?: string;
  transaction_type?: 'expense' | 'income';
  limit?: number;
}

export interface QueryPayload {
  query_type: QueryType;
  filters: QueryFilters;
  raw_query: string;
  confidence: number;
}

export interface GreetingPayload {
  confidence: number;
}

// ─── Channel processor ───────────────────────────────────────────────────────

export type ActionStatus = 'READY' | 'NEEDS_CONFIRMATION' | 'AMBIGUOUS' | 'NEEDS_CLARIFICATION';

export type ResolvedAction = AgentParseResult & {
  status: ActionStatus;
  candidates?: unknown[];
  follow_up_question?: string;
};

// Acción enriquecida con el ID concreto que el usuario eligió/confirmó
export type ExecutableAction = AgentParseResult & { resolved_id?: string };

// ─── Result ──────────────────────────────────────────────────────────────────

export interface AgentParseResult {
  intent: AgentIntent;
  parsed_from: 'text' | 'audio';
  data:
    | CreatePayload
    | UpdatePayload
    | DeletePayload
    | QueryPayload
    | CreateAccountPayload
    | UpdateAccountPayload
    | DeleteAccountPayload
    | CreateCategoryPayload
    | UpdateCategoryPayload
    | DeleteCategoryPayload
    | GreetingPayload;
}
