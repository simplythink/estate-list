import { computed } from 'vue';
import { LIABILITY_TYPES } from '../constants.js';
import { generateId, todayString } from '../utils.js';
import { fetchTWSEMarketData, findStockInMarketData } from '../api.js';

export function useAssets(db, isLoading) {
  const isLiability = (type) => LIABILITY_TYPES.has(type);

  const getGroupItems = (type) =>
    db.value.assets.filter((i) => i.type === type);

  const getGroupTotal = (type) =>
    getGroupItems(type).reduce((sum, i) => sum + (i.value || 0), 0);

  const getCount = (type) => getGroupItems(type).length;

  const totalAssets = computed(() =>
    db.value.assets
      .filter((i) => !isLiability(i.type))
      .reduce((sum, i) => sum + (i.value || 0), 0),
  );

  const totalLiabilities = computed(() =>
    db.value.assets
      .filter((i) => isLiability(i.type))
      .reduce((sum, i) => sum + (i.value || 0), 0),
  );

  const netWorth = computed(() => totalAssets.value - totalLiabilities.value);

  function addItem(section, type, itemData) {
    db.value[section].unshift({
      id: generateId(),
      type,
      date: todayString(),
      ...itemData,
    });
  }

  function removeItem(section, id) {
    if (!confirm('確定刪除？')) return;
    db.value[section] = db.value[section].filter((i) => i.id !== id);
  }

  function updateItem(section, id, updates) {
    const idx = db.value[section].findIndex((i) => i.id === id);
    if (idx === -1) return;
    db.value[section][idx] = { ...db.value[section][idx], ...updates };
  }

  async function addTWStock(symbol, shares) {
    isLoading.value = true;
    try {
      const data = await fetchTWSEMarketData();
      const stock = findStockInMarketData(data, symbol);
      if (!stock) {
        alert('找不到該股票代號，或該股票目前無收盤價資料');
        return false;
      }

      addItem('assets', 'stock_tw', {
        name: stock.name,
        symbol,
        shares,
        currentPrice: stock.price,
        value: stock.price * shares,
      });
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function syncAllStockPrices() {
    const hasStocks = db.value.assets.some(
      (i) => i.type === 'stock_tw' && i.symbol,
    );
    if (!hasStocks) return;

    isLoading.value = true;
    try {
      const data = await fetchTWSEMarketData();
      let updatedCount = 0;

      db.value.assets = db.value.assets.map((item) => {
        if (item.type !== 'stock_tw' || !item.symbol) return item;

        const stock = findStockInMarketData(data, item.symbol);
        if (!stock) return item;

        updatedCount++;
        return {
          ...item,
          currentPrice: stock.price,
          value: stock.price * item.shares,
        };
      });

      alert(`已成功同步 ${updatedCount} 檔台股市值！`);
    } catch (e) {
      alert('更新失敗：' + e.message);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLiability,
    getGroupItems,
    getGroupTotal,
    getCount,
    totalAssets,
    totalLiabilities,
    netWorth,
    addItem,
    removeItem,
    updateItem,
    addTWStock,
    syncAllStockPrices,
  };
}
