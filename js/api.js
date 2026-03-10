import { TWSE_API_URL, TWSE_COLUMNS } from './constants.js';

const parsePrice = (raw) => parseFloat(raw.replace(/,/g, ''));

export async function fetchTWSEMarketData() {
  const res = await fetch(TWSE_API_URL);
  if (!res.ok) throw new Error(`API 請求失敗 (${res.status})`);

  const json = await res.json();
  if (json.stat !== 'OK' || !json.data) throw new Error('API 回傳資料異常');

  return json.data;
}

export function findStockInMarketData(data, symbol) {
  const row = data.find(
    (r) => r[TWSE_COLUMNS.SYMBOL].trim() === symbol.trim(),
  );
  if (!row) return null;

  const price = parsePrice(row[TWSE_COLUMNS.CLOSE_PRICE]);
  if (isNaN(price) || price <= 0) return null;

  return { name: row[TWSE_COLUMNS.NAME].trim(), price };
}
