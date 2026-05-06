import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AgentIntent,
  AgentParseResult,
  AccountContext,
  CategoryContext,
  VALID_INTENTS,
} from "../../types/agent.types";

export type {
  AgentIntent,
  AgentParseResult,
  AccountContext,
  CategoryContext,
  TransactionSearchCriteria,
  CreatePayload,
  UpdatePayload,
  DeletePayload,
  CreateAccountPayload,
  UpdateAccountPayload,
  DeleteAccountPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  DeleteCategoryPayload,
  QueryType,
  QueryFilters,
  QueryPayload,
  GreetingPayload,
} from "../../types/agent.types";

const PROMPT_TEMPLATE = (
  input: string,
  categories: CategoryContext[],
  accounts: AccountContext[],
  nowIso: string,
  timezone: string,
) => `
Eres un asistente financiero personal. Analiza el texto del usuario, detecta TODAS las intenciones presentes y extrae los datos de cada una.
Responde ÚNICAMENTE con un array JSON puro, sin markdown, sin texto adicional.

CAMPOS OBLIGATORIOS — si falta alguno, devuelve ese elemento con confidence: 0:
- CREATE_TRANSACTION: "amount" debe ser un número concreto y positivo que el usuario haya mencionado explícitamente.
- CREATE_CATEGORY: "name" debe ser un sustantivo propio que el usuario declaró como nombre de la categoría (ej: "Mascotas", "Gimnasio"). Un artículo, adjetivo, pronombre o expresión vaga NO es un nombre válido.
- CREATE_ACCOUNT: "name" debe ser un identificador concreto que el usuario declaró (ej: "Tarjeta BAC", "Cuenta corriente"). Un artículo, adjetivo, pronombre o expresión vaga NO es un nombre válido. Además, "type" debe poder inferirse claramente del texto (ej: "tarjeta de crédito" → "credit", "cuenta de ahorros" → "savings"); si no se puede inferir con certeza, confidence: 0.

CRITERIO PARA UN NOMBRE VÁLIDO: el usuario debe haber dicho explícitamente cómo se llama la entidad.
Si la frase no contiene ese dato — aunque implique que quiere crear algo — el nombre no fue proporcionado → confidence: 0.
Ejemplos SIN nombre válido: "crea una nueva", "agrega otra", "crea una categoría", "quiero una cuenta".
Ejemplos CON nombre válido: "crea la categoría Mascotas", "agrega una cuenta llamada BAC", "nueva categoría: Viajes".

IMPORTANTE sobre múltiples acciones:
- SIEMPRE devuelve un array JSON, aunque solo haya una acción (array de un elemento).
- Si el texto implica más de una acción (ej: crear una categoría Y registrar una transacción), incluye un objeto por cada acción.
- El ORDEN importa: si una acción depende de otra, ponla primero. Ejemplo: si el usuario pide crear la categoría "Mascotas" y registrar un gasto en ella, el array debe ser [CREATE_CATEGORY, CREATE_TRANSACTION].

FECHA Y HORA ACTUAL: ${nowIso} (zona horaria: ${timezone})
Usa esta fecha para resolver referencias relativas como "ayer", "hoy", "el lunes pasado", etc.

CATEGORÍAS DISPONIBLES (usa el "id" exacto de esta lista):
${JSON.stringify(categories, null, 2)}

CUENTAS DISPONIBLES (usa el "id" exacto para "account_id"):
${JSON.stringify(accounts, null, 2)}
Reglas para "account_id" en CREATE_TRANSACTION:
- Si el usuario mencionó la cuenta explícitamente → usa su id exacto.
- Si no mencionó la cuenta y solo hay una en la lista → usa su id.
- Si no mencionó la cuenta y hay varias → usa account_id: null.

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
- GREETING: el usuario está saludando o iniciando una conversación sin pedir ninguna acción financiera (ej: "hola", "buenos días", "hey, ¿cómo estás?", "hi").

REGLAS DE EXTRACCIÓN POR INTENCIÓN:

Para CREATE_TRANSACTION, responde:
{
  "intent": "CREATE_TRANSACTION",
  "data": {
    "amount": <número positivo, normaliza "5.000"→5000, "$3.50"→3.50>,
    "currency": <código ISO 4217 de la moneda (ej: "USD" para dólares, "EUR" para euros), o "CRC" por defecto si no se menciona>,
    "type": <"expense" si el usuario gastó/pagó/compró/salió dinero, "income" si recibió/ganó/ingresó/entró dinero>,
    "merchant": <nombre del comercio o null>,
    "account_id": <UUID de la lista de cuentas según las reglas anteriores, o null>,
    "account_name": <nombre de la cuenta usada o null>,
    "category_id": <UUID de la lista de categorías o null>,
    "category_name": <nombre de la categoría o null>,
    "date": <"YYYY-MM-DD", fecha actual si no se menciona>,
    "description": <descripción corta y limpia de la transacción, ej: "Almuerzo", "Pago Netflix", "Gasolina", "Salario">,
    "notes": <texto original exacto del usuario sin modificar>,
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
    "query_type": <uno de: "LIST_TRANSACTIONS" | "LIST_ACCOUNTS" | "LIST_CATEGORIES" | "ACCOUNT_BALANCE" | "ACCOUNT_STATEMENT" | "SPENDING_SUMMARY">,
    "filters": {
      "date_from": <"YYYY-MM-DD" fecha inicio del rango, opcional>,
      "date_to": <"YYYY-MM-DD" fecha fin del rango, opcional>,
      "account_name": <nombre parcial de la cuenta mencionada, opcional>,
      "account_id": <UUID exacto si está en la lista de cuentas, opcional>,
      "category_name": <nombre parcial de la categoría mencionada, opcional>,
      "category_id": <UUID exacto si está en la lista de categorías, opcional>,
      "transaction_type": <"expense" | "income" si el usuario lo especificó, opcional>,
      "limit": <número máximo de resultados si el usuario indicó una cantidad, opcional>
    },
    "raw_query": <la pregunta del usuario sin modificar>,
    "confidence": <0 a 1>
  }
}

Para GREETING, responde:
{
  "intent": "GREETING",
  "data": {
    "confidence": 1
  }
}

CRITERIO PARA ELEGIR query_type:
- LIST_TRANSACTIONS: el usuario quiere ver una lista de transacciones (ej: "muéstrame mis transacciones", "qué gasté ayer", "transacciones de esta semana").
- LIST_ACCOUNTS: el usuario quiere ver sus cuentas (ej: "qué cuentas tengo", "muéstrame mis cuentas").
- LIST_CATEGORIES: el usuario quiere ver sus categorías (ej: "qué categorías tengo", "muéstrame las categorías").
- ACCOUNT_BALANCE: el usuario pregunta por el saldo de una cuenta específica (ej: "cuál es el saldo de mi cuenta de ahorros", "cuánto tengo en mi tarjeta").
- ACCOUNT_STATEMENT: el usuario quiere un resumen/estado de cuenta de una cuenta específica incluyendo transacciones recientes (ej: "dame el estado de cuenta de mi BAC", "estado de mi cuenta corriente").
- SPENDING_SUMMARY: el usuario quiere un resumen de gastos/ingresos por período (ej: "cuánto gasté este mes", "resumen de gastos de la semana", "cuánto he gastado en comida").
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
    accounts: AccountContext[],
    parsedFrom: "text" | "audio" = "text",
  ): Promise<AgentParseResult[]> {
    const client = this.getClient();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
    const model = client.getGenerativeModel({ model: modelName });

    const { iso, timezone } = this.getNow();
    const prompt = PROMPT_TEMPLATE(input, categories, accounts, iso, timezone);

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
    const items: Array<{ intent: AgentIntent; data: unknown }> = Array.isArray(
      rawParsed,
    )
      ? (rawParsed as Array<{ intent: AgentIntent; data: unknown }>)
      : [rawParsed as { intent: AgentIntent; data: unknown }];

    // Si el modelo no identificó ninguna acción o devolvió una intent inválida, retornar
    // una acción de clarificación en lugar de lanzar un error — el bot preguntará al usuario.
    if (
      items.length === 0 ||
      items.some((item) => !VALID_INTENTS.includes(item.intent))
    ) {
      return [
        {
          intent: "QUERY" as AgentIntent,
          parsed_from: parsedFrom,
          data: { raw_query: input, confidence: 0 } as AgentParseResult["data"],
        },
      ];
    }

    return items.map((item) => ({
      intent: item.intent,
      parsed_from: parsedFrom,
      data: item.data as AgentParseResult["data"],
    }));
  }
}
