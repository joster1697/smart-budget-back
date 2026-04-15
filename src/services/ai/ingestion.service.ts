import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CategoryContext {
  id: string;
  name: string;
}

export interface ParsedTransaction {
  amount: number;
  currency: string;
  merchant: string | null;
  category_id: string | null;
  category_name: string | null;
  date: string;
  description: string;
  confidence: number;
  parsed_from: 'text' | 'audio';
}

const PROMPT_TEMPLATE = (
  input: string,
  categories: CategoryContext[],
  nowIso: string,
  timezone: string
) => `
Eres un asistente financiero personal. Tu única tarea es extraer datos de una transacción económica a partir del texto del usuario y devolverlos como JSON puro, sin ningún texto adicional, sin bloques de código markdown.

FECHA Y HORA ACTUAL: ${nowIso} (zona horaria: ${timezone})
Usa esta fecha para resolver referencias relativas como "ayer", "hoy", "el lunes pasado", etc.

CATEGORÍAS DISPONIBLES (debes elegir una de esta lista usando su "id"):
${JSON.stringify(categories, null, 2)}

TEXTO DEL USUARIO:
"${input}"

INSTRUCCIONES DE EXTRACCIÓN:
1. amount: número positivo. Normaliza formatos: "5.000" → 5000, "$3.50" → 3.50. Sin símbolo de moneda.
2. currency: código ISO 4217 (ej: "CRC", "USD"). Si no se menciona, usa "CRC" por defecto.
3. merchant: nombre legible del comercio o lugar (ej: "Walmart", "Café Britt"). null si no se identifica.
4. category_id: UUID de la categoría más apropiada de la lista. null si ninguna aplica claramente.
5. category_name: nombre de la categoría elegida. null si category_id es null.
6. date: fecha de la transacción en formato "YYYY-MM-DD". Usa la fecha actual si no se menciona.
7. description: texto original del usuario, limpio y sin modificar.
8. confidence: número entre 0 y 1 indicando qué tan seguro estás de la extracción (1 = muy seguro).

RESPONDE ÚNICAMENTE con este JSON (sin markdown, sin texto antes o después):
{
  "amount": <número>,
  "currency": "<string>",
  "merchant": <string|null>,
  "category_id": <string|null>,
  "category_name": <string|null>,
  "date": "<YYYY-MM-DD>",
  "description": "<string>",
  "confidence": <número>
}
`;

export class IngestionService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private static getNow(): { iso: string; timezone: string } {
    const timezone = process.env.APP_TIMEZONE || 'America/Costa_Rica';
    const now = new Date();
    // Formato ISO con offset usando Intl (sin dependencias extra)
    const iso = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now).replace(' ', 'T');
    return { iso, timezone };
  }

  static async parseFromText(
    input: string,
    categories: CategoryContext[],
    parsedFrom: 'text' | 'audio' = 'text'
  ): Promise<ParsedTransaction> {
    const client = this.getClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    const model = client.getGenerativeModel({ model: modelName });

    const { iso, timezone } = this.getNow();
    const prompt = PROMPT_TEMPLATE(input, categories, iso, timezone);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    let parsed: Omit<ParsedTransaction, 'parsed_from'>;
    try {
      // Eliminar posibles bloques de código markdown si el modelo los incluyó de todas formas
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`La IA devolvió una respuesta no parseable: ${rawText}`);
    }

    // Validaciones mínimas
    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
      throw new Error('No se pudo extraer un monto válido del texto');
    }

    return { ...parsed, parsed_from: parsedFrom };
  }
}
