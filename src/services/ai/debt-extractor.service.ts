import { GoogleGenerativeAI } from "@google/generative-ai";
import { PIIHelper } from "../security/pii.helper";

export interface ExtractedDebtData {
  name: string | null;
  currency: "CRC" | "USD";
  balance: number | null;
  interest_rate: number | null;
  total_installment: number | null;
  insurance_cost: number;
  other_fees: number;
  remaining_terms: number | null;
  operation_number: string | null;
}

const DEBT_EXTRACTOR_PROMPT = `
Analiza el siguiente extracto bancario, estado de cuenta o documento de crédito de un banco costarricense (BAC, Banco Nacional, BCR, Promerica, Davivienda, Scotiabank, Coopenae, Mucap, etc.).
Extrae los siguientes datos financieros de la deuda. Si un campo no está explícitamente presente, infiérelo a partir de la lógica financiera o devuélvelo como se especifica en las instrucciones.

Responde ÚNICAMENTE con un objeto JSON puro con el siguiente formato, sin markdown (bloques de código \`\`\`json), sin explicaciones adicionales:

{
  "name": <string | null - Nombre descriptivo de la deuda basándote en la institución financiera y tipo de crédito. Ej: "BAC Hipoteca", "BNCR Préstamo Personal">,
  "currency": <"CRC" o "USD" - Si es en Colones (₡, colones, CRC) o Dólares ($, USD, dólares)>,
  "balance": <number | null - Saldo actual o saldo deudor actual de la operación, sin comas. Ej: 1540300.25>,
  "interest_rate": <number | null - Tasa de interés nominal anual como porcentaje. Ej: 8.5 (significa 8.5% anual)>,
  "total_installment": <number | null - Monto total de la cuota mensual actual (incluyendo capital, intereses y cargos)>,
  "insurance_cost": <number - Costo de seguros asociados mensualmente. Si no se indica, pon 0.00>,
  "other_fees": <number - Comisiones o cargos fijos adicionales mensuales. Si no se indica, pon 0.00>,
  "remaining_terms": <number | null - Plazo restante de pago medido en meses (cuotas restantes) o calculado si se indica la fecha de vencimiento y fecha del estado de cuenta>,
  "operation_number": <string | null - Número de operación, número de crédito o contrato de la deuda>
}

Reglas críticas de moneda y números:
1. "currency": Si detectas símbolos de colones (₡) o las palabras "colones", "CRC", etc. usa "CRC". Si detectas símbolos de dólar ($) o las palabras "dólares", "USD", etc. usa "USD".
2. Normaliza todos los importes numéricos a float puro sin separadores de miles y con punto decimal (ej: "1.500.000,50" -> 1500000.50).
3. Si el "insurance_cost" o "other_fees" están desglosados en el desglose de la cuota, extráelos.
4. "name": Escribe un nombre amigable e identificable de la entidad (ej. "BAC Credomatic", "Banco de Costa Rica", "Banco Nacional") junto al tipo de deuda (ej. "Préstamo Personal", "Hipotecario", "Vehículo").
`;

export class DebtExtractorService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY no está configurada en las variables de entorno"
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Processes a PDF file buffer, uploads to Gemini for multimodal extraction,
   * normalizes currencies, and scrubs PII.
   */
  static async extractFromPdf(pdfBuffer: Buffer): Promise<ExtractedDebtData> {
    const client = this.getClient();
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = client.getGenerativeModel({ model: modelName });

    try {
      const inlineData = {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };

      const result = await model.generateContent([inlineData, DEBT_EXTRACTOR_PROMPT]);
      const rawText = result.response.text().trim();

      // Clean markdown code blocks if the model included them
      const cleanedJson = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const extractedData: ExtractedDebtData = JSON.parse(cleanedJson);

      // Perform validation and normalization
      if (extractedData.currency !== "CRC" && extractedData.currency !== "USD") {
        extractedData.currency = "CRC"; // Default
      }

      // Convert null/undefined to default values where appropriate
      extractedData.insurance_cost = Number(extractedData.insurance_cost || 0);
      extractedData.other_fees = Number(extractedData.other_fees || 0);
      if (extractedData.balance !== null) extractedData.balance = Number(extractedData.balance);
      if (extractedData.interest_rate !== null) extractedData.interest_rate = Number(extractedData.interest_rate);
      if (extractedData.total_installment !== null) extractedData.total_installment = Number(extractedData.total_installment);
      if (extractedData.remaining_terms !== null) extractedData.remaining_terms = Math.round(Number(extractedData.remaining_terms));

      // Scrub PII from fields like 'name'
      const scrubbedData = PIIHelper.scrubObject(extractedData);

      return scrubbedData;
    } catch (error) {
      console.error("Error extracting debt data from PDF:", error);
      throw new Error(
        `Error al extraer datos financieros del PDF: ${(error as Error).message}`
      );
    }
  }
}
