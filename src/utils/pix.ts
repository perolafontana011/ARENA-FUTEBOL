import QRCode from 'qrcode';
import { PixConfig } from '../types';

/**
 * Calculates standard CRC16-CCITT checksum for BR Code (PIX).
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Formats a single EMV TLV (Tag, Length, Value) chunk.
 */
function formatEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Normalizes text for PIX standard (ASCII only, no special characters or accents).
 */
function sanitizeAscii(str: string, maxLength: number): string {
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
  return normalized.substring(0, maxLength);
}

/**
 * Generates an official EMV BR Code PIX "Copia e Cola" string.
 */
export function generatePixCopiaECola(
  config: PixConfig,
  amount: number,
  txid: string = '***',
  infoAdicional: string = 'Barraca Arena Gol'
): string {
  // Format amount to 2 decimal places
  const formattedAmount = amount > 0 ? amount.toFixed(2) : '0.00';
  const cleanTxid = txid ? sanitizeAscii(txid, 25) || '***' : '***';
  const cleanMerchant = sanitizeAscii(config.merchantName || 'ARENA GOL', 25);
  const cleanCity = sanitizeAscii(config.merchantCity || 'SAO PAULO', 15);
  const cleanPixKey = config.key.trim();

  // Tag 26: Merchant Account Information - PIX
  const gui = formatEMV('00', 'br.gov.bcb.pix');
  const key = formatEMV('01', cleanPixKey);
  const desc = infoAdicional ? formatEMV('02', sanitizeAscii(infoAdicional, 40)) : '';
  const merchantAccountInfo = formatEMV('26', `${gui}${key}${desc}`);

  // Base payload without CRC
  let payload = '';
  payload += formatEMV('00', '01'); // Payload Format Indicator
  payload += formatEMV('01', '12'); // Point of Initiation: 12 = Dynamic/Static with value
  payload += merchantAccountInfo;
  payload += formatEMV('52', '0000'); // Merchant Category Code
  payload += formatEMV('53', '986'); // Transaction Currency: 986 = BRL
  if (amount > 0) {
    payload += formatEMV('54', formattedAmount); // Transaction Amount
  }
  payload += formatEMV('58', 'BR'); // Country Code
  payload += formatEMV('59', cleanMerchant || 'ARENA GOL'); // Merchant Name
  payload += formatEMV('60', cleanCity || 'SAO PAULO'); // Merchant City
  
  // Tag 62: Additional Data Field (txid)
  const additionalData = formatEMV('05', cleanTxid);
  payload += formatEMV('62', additionalData);

  // Tag 63: CRC16 calculation block
  const payloadToHash = `${payload}6304`;
  const checksum = crc16(payloadToHash);

  return `${payloadToHash}${checksum}`;
}

/**
 * Generates a data URL containing the QR Code image for the PIX payload.
 */
export async function generatePixQrCodeDataUrl(copiaECola: string): Promise<string> {
  try {
    return await QRCode.toDataURL(copiaECola, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Failed to generate PIX QR Code', error);
    return '';
  }
}

/**
 * Formats Brazilian Real currency string.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats phone number to Brazilian standard (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
