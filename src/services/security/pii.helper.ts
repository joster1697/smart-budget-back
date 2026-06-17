/**
 * Helper to scrub PII (Personally Identifiable Information) from strings or objects.
 */
export class PIIHelper {
  // Email pattern
  private static EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  // Costa Rica IBAN account numbers: starts with CR, followed by 20 digits (e.g. CR000000000000000000)
  private static CR_IBAN_REGEX = /\bCR\d{20}\b/gi;

  // Generic bank account numbers (10 to 18 digits)
  private static BANK_ACCOUNT_REGEX = /\b\d{10,18}\b/g;

  // Costa Rica National ID (Cédula de Identidad, e.g. 1-1234-5678, 1 1234 5678, or 112345678)
  // Format is: 1 digit - 4 digits - 4 digits
  private static CR_CEDULA_REGEX = /\b[1-9]-?\d{4}-?\d{4}\b/g;

  // Costa Rica Corporate ID (Cédula Jurídica, e.g. 3-101-123456)
  // Format is: 1 digit - 3 digits - 6 digits
  private static CR_JURIDICA_REGEX = /\b[3-9]-?\d{3}-?\d{6}\b/g;

  /**
   * Cleans a string from PII patterns.
   */
  static scrubString(text: string): string {
    if (!text) return text;
    let scrubbed = text;
    
    // Replace emails
    scrubbed = scrubbed.replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]');
    
    // Replace Costa Rican IBAN accounts
    scrubbed = scrubbed.replace(this.CR_IBAN_REGEX, '[IBAN_REDACTED]');
    
    // Replace Costa Rican Cédula de Identidad
    scrubbed = scrubbed.replace(this.CR_CEDULA_REGEX, '[ID_REDACTED]');
    
    // Replace Costa Rican Cédula Jurídica
    scrubbed = scrubbed.replace(this.CR_JURIDICA_REGEX, '[JURIDICA_REDACTED]');

    // Replace account numbers (but filter out common numbers like dates/years/simple totals)
    // We only apply this if it looks like a long account number sequence (10+ digits)
    scrubbed = scrubbed.replace(this.BANK_ACCOUNT_REGEX, '[ACCOUNT_REDACTED]');
    
    return scrubbed;
  }

  /**
   * Recursively traverses and scrubs PII from values in an object or array.
   */
  static scrubObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.scrubString(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const scrubbedObj = { ...obj } as any;
      for (const key in scrubbedObj) {
        if (Object.prototype.hasOwnProperty.call(scrubbedObj, key)) {
          // If the key is 'operation_number', we DO NOT scrub it since it will be encrypted at rest,
          // but we scrub everything else (descriptions, names, raw notes).
          if (key === 'operation_number') {
            continue;
          }
          scrubbedObj[key] = this.scrubObject(scrubbedObj[key]);
        }
      }
      return scrubbedObj as T;
    }

    return obj;
  }
}
