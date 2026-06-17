import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES uses 16 bytes IV

function getEncryptionKey(): Buffer {
  const secret = process.env.DEBT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fynkro_default_secret_key_32_bytes_long_minimum';
  
  // Use SHA-256 to hash the key material to ensure it is exactly 32 bytes (256 bits)
  return crypto.createHash('sha256').update(secret).digest();
}

export class CryptoHelper {
  /**
   * Encrypts plain text using AES-256-CBC.
   * Output is formatted as 'hex_iv:hex_ciphertext'.
   */
  static encrypt(text: string): string {
    if (!text) return '';
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext (formatted as 'hex_iv:hex_ciphertext') back to plain text.
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return '';
    
    try {
      const key = getEncryptionKey();
      const [ivHex, ciphertextHex] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return '[DECRYPTION_ERROR]';
    }
  }
}
