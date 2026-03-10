export const STORAGE_KEY = 'pure_wealth_v3';

export const TWSE_API_URL =
  'https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json';

export const TWSE_COLUMNS = Object.freeze({
  SYMBOL: 0,
  NAME: 1,
  CLOSE_PRICE: 7,
});

export const ASSET_TYPES = {
  cash: '現金存款',
  stock_tw: '台股投資',
  stock_us: '美股證券',
  real_estate: '不動產',
  loan: '債務借貸',
  credit_card: '信用卡額度',
};

export const ASSET_COLORS = {
  cash: '#4F46E5',
  stock_tw: '#10B981',
  stock_us: '#8B5CF6',
  real_estate: '#F59E0B',
  loan: '#EF4444',
  credit_card: '#F97316',
};

export const LIABILITY_TYPES = new Set(['loan', 'credit_card']);
