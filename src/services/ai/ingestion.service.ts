import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CategoryContext {
  id: string;
  name: string;
}

export type AgentIntent =
  | "CREATE_TRANSACTION"
  | "UPDATE_TRANSACTION"
  | "DELETE_TRANSACTION"
  | "CREATE_ACCOUNT"
  | "UPDATE_ACCOUNT"
  | "DELETE_ACCOUNT"
  | "CREATE_CATEGORY"
  | "UPDATE_CATEGORY"
  | "DELETE_CATEGORY"
  | "QUERY";

export interface CreatePayload {
  amount: number;
  currency: string;
  merchant: string | null;
  category_id: string | null;
  category_name: string | null;
  date: string;
  description: string;
  confidence: number;
}

export interface TransactionSearchCriteria {
  description?: string;
  merchant?: string;
  date?: string;
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

export interface QueryPayload {
  raw_query: string;
  confidence: number;
}

export interface CreateAccountPayload {
  name: string;
  type: string;
  balance: number;
  currency: string;
  confidence: number;
}

export interface CreateCategoryPayload {
  name: string;
  confidence: number;
}

export interface AccountSearchCriteria {
  name?: string;
  type?: string;
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

export interface CategorySearchCriteria {
  name?: string;
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

export interface AgentParseResult {
  intent: AgentIntent;
  parsed_from: "text" | "audio";
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
    | DeleteCategoryPayload;
}

const VALID_INTENTS: AgentIntent[] = [
  'CREATE_TRANSACTION', 'UPDATE_TRANSACTION', 'DELETE_TRANSACTION',
  'CREATE_ACCOUNT', 'UPDATE_ACCOUNT', 'DELETE_ACCOUNT',
  'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
  'QUERY',
];

const PROMPT_TEMPLATE = (
  input: string,
  categories: CategoryContext[],
  nowIso: string,
  timezone: string,
) => `
Eres un asistente financiero personal. Analiza el texto del usuario, detecta TODAS las intenciones presentes y extrae los datos de cada una.
Responde ÚNICAMENTE con un array JSON puro, sin markdown, sin texto adicional.

IMPORTANTE sobre múltiples acciones:
- SIEMPRE devuelve un array JSON, aunque solo haya una acción (array de un elemento).
- Si el texto implica más de una acción (ej: crear una categoría Y registrar una transacción), incluye un objeto por cada acción.
- El ORDEN importa: si una acción depende de otra, ponla primero. Ejemplo: si el usuario pide crear la categoría "Mascotas" y registrar un gasto en ella, el array debe ser [CREATE_CATEGORY, CREATE_TRANSACTION].

FECHA Y HORA ACTUAL: ${nowIso} (zona horaria: ${timezone})
Usa esta fecha para resolver referencias relativas como "ayer", "hoy", "el lunes pasado", etc.

CATEGORÍAS DISPONIBLES (usa el "id" exacto de esta lista):
${JSON.stringify(categories, null, 2)}

TEXTO DEL USUARIO:
"${input}"

INTENCIONES POSIBLES:
- CREATE_TRANSACTION: el usuario quiere registrar un gasto/ingreso nuevo (ej: "gasté 5000 en el súper", "recibí 200 dólares").
- UPDATE_TRANSACTION: el usuario quiere modificar una transacción existente (ej: "cambia el monto del café de ayer", "ese gasto era de transporte no alimentación").
- DELETE_TRANSACTION: el usuario quiere eliminar una transacción (ej: "borra el gasto del súper de ayer", "elimina esa compra").
- CREATE_ACCOUNT: el usuario quiere crear una cuenta nueva (ej: "crea una cuenta de ahorros", "agrega mi tarjeta de crédito BAC", "nueva cuenta corriente con saldo 50000").
- CREATE_CATEGORY: el usuario quiere crear una categoría nueva (ej: "crea una categoría de mascotas", "agrega la categoría Gimnasio").
- UPDATE_ACCOUNT: el usuario quiere modificar una cuenta existente (ej: "cambia el nombre de mi cuenta BAC", "actualiza el saldo de mi cuenta de ahorro a 100000").
- DELETE_ACCOUNT: el usuario quiere eliminar una cuenta (ej: "borra mi cuenta BAC", "elimina la cuenta de ahorros").
- UPDATE_CATEGORY: el usuario quiere renombrar una categoría (ej: "cambia Comida a Alimentación", "renombra la categoría Gym a Gimnasio").
- DELETE_CATEGORY: el usuario quiere eliminar una categoría (ej: "borra la categoría Mascotas", "elimina la categoría Gimnasio").
- QUERY: el usuario hace una pregunta sobre sus finanzas (ej: "cuánto gasté este mes", "cuál es mi saldo").

REGLAS DE EXTRACCIÓN POR INTENCIÓN:

Para CREATE_TRANSACTION, responde:
{
  "intent": "CREATE_TRANSACTION",
  "data": {
    "amount": <número positivo, normaliza "5.000"→5000, "$3.50"→3.50>,
    "currency": <"CRC" por defecto si no se menciona, o código ISO 4217>,
    "merchant": <nombre del comercio o null>,
    "category_id": <UUID de la lista o null>,
    "category_name": <nombre de la categoría o null>,
    "date": <"YYYY-MM-DD", fecha actual si no se menciona>,
    "description": <texto original del usuario>,
    "confidence": <0 a 1>
  }
}

Para UPDATE_TRANSACTION, responde:
{
  "intent": "UPDATE_TRANSACTION",
  "data": {
    "search": {
      "description": <texto que identifica la transacción, opcional>,
      "merchant": <comercio de la transacción a buscar, opcional>,
      "date": <"YYYY-MM-DD" de la transacción a buscar, opcional>
    },
    "changes": {
      <solo los campos que el usuario quiere cambiar, omite los demás>
      "amount": <nuevo monto, opcional>,
      "currency": <nueva moneda, opcional>,
      "merchant": <nuevo comercio, opcional>,
      "category_id": <nuevo UUID de categoría, opcional>,
      "category_name": <nuevo nombre de categoría, opcional>,
      "date": <nueva fecha "YYYY-MM-DD", opcional>,
      "description": <nueva descripción, opcional>
    },
    "confidence": <0 a 1>
  }
}

Para DELETE_TRANSACTION, responde:
{
  "intent": "DELETE_TRANSACTION",
  "data": {
    "search": {
      "description": <texto que identifica la transacción, opcional>,
      "merchant": <comercio, opcional>,
      "date": <"YYYY-MM-DD", opcional>
    },
    "confidence": <0 a 1>
  }
}

Para CREATE_ACCOUNT, responde:
{
  "intent": "CREATE_ACCOUNT",
  "data": {
    "name": <nombre descriptivo de la cuenta, ej: "Tarjeta BAC", "Cuenta de ahorros">,
    "type": <tipo inferido: "checking" | "savings" | "credit" | "cash" | "investment">,
    "balance": <saldo inicial como número, 0 si no se menciona>,
    "currency": <"CRC" por defecto o código ISO 4217>,
    "confidence": <0 a 1>
  }
}

Para CREATE_CATEGORY, responde:
{
  "intent": "CREATE_CATEGORY",
  "data": {
    "name": <nombre de la categoría en formato título, ej: "Mascotas", "Gimnasio">,
    "confidence": <0 a 1>
  }
}

Para UPDATE_ACCOUNT, responde:
{
  "intent": "UPDATE_ACCOUNT",
  "data": {
    "search": {
      "name": <nombre parcial de la cuenta a buscar, opcional>,
      "type": <tipo de cuenta: "checking" | "savings" | "credit" | "cash" | "investment", opcional>
    },
    "changes": {
      "name": <nuevo nombre, opcional>,
      "type": <nuevo tipo, opcional>,
      "balance": <nuevo saldo como número, opcional>
    },
    "confidence": <0 a 1>
  }
}

Para DELETE_ACCOUNT, responde:
{
  "intent": "DELETE_ACCOUNT",
  "data": {
    "search": {
      "name": <nombre parcial de la cuenta, opcional>,
      "type": <tipo de cuenta, opcional>
    },
    "confidence": <0 a 1>
  }
}

Para UPDATE_CATEGORY, responde:
{
  "intent": "UPDATE_CATEGORY",
  "data": {
    "search": {
      "name": <nombre actual de la categoría>
    },
    "changes": {
      "name": <nuevo nombre de la categoría>
    },
    "confidence": <0 a 1>
  }
}

Para DELETE_CATEGORY, responde:
{
  "intent": "DELETE_CATEGORY",
  "data": {
    "search": {
      "name": <nombre de la categoría a eliminar>
    },
    "confidence": <0 a 1>
  }
}

Para QUERY, responde:
{
  "intent": "QUERY",
  "data": {
    "raw_query": <la pregunta del usuario sin modificar>,
    "confidence": <0 a 1>
  }
}
`;

export class IngestionService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY no está configurada en las variables de entorno",
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private static getNow(): { iso: string; timezone: string } {
    const timezone = process.env.APP_TIMEZONE || "America/Costa_Rica";
    const now = new Date();
    const iso = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(now)
      .replace(" ", "T");
    return { iso, timezone };
  }

  static async parseFromText(
    input: string,
    categories: CategoryContext[],
    parsedFrom: "text" | "audio" = "text",
  ): Promise<AgentParseResult[]> {
    const client = this.getClient();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
    const model = client.getGenerativeModel({ model: modelName });

    const { iso, timezone } = this.getNow();
    const prompt = PROMPT_TEMPLATE(input, categories, iso, timezone);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    let rawParsed: unknown;
    try {
      // Eliminar posibles bloques de código markdown si el modelo los incluyó de todas formas
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      rawParsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`La IA devolvió una respuesta no parseable: ${rawText}`);
    }

    // Normalizar: si el modelo devolvió un objeto único (retro-compatibilidad), envolvemos en array
    const items: Array<{ intent: AgentIntent; data: unknown }> = Array.isArray(rawParsed)
      ? (rawParsed as Array<{ intent: AgentIntent; data: unknown }>)
      : [rawParsed as { intent: AgentIntent; data: unknown }];

    if (items.length === 0) {
      throw new Error("La IA no identificó ninguna acción en el texto");
    }

    for (const item of items) {
      if (!VALID_INTENTS.includes(item.intent)) {
        throw new Error(`Intent no reconocida: ${item.intent}`);
      }
      if (item.intent === "CREATE_TRANSACTION") {
        const data = item.data as CreatePayload;
        if (typeof data.amount !== "number" || data.amount <= 0) {
          throw new Error("No se pudo extraer un monto válido del texto");
        }
      }
    }

    return items.map((item) => ({
      intent: item.intent,
      parsed_from: parsedFrom,
      data: item.data as AgentParseResult["data"],
    }));
  }
}
