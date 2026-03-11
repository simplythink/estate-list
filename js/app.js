import { createApp, ref, computed, watch, onMounted, nextTick } from 'vue';
import { STORAGE_KEY, ASSET_TYPES, ASSET_COLORS } from './constants.js';
import { formatNumber, formatShortNumber } from './utils.js';
import { useAssets } from './composables/useAssets.js';
import { useChart } from './composables/useChart.js';
import { useFixedExpenses } from './composables/useFixedExpenses.js';

// 在支援的瀏覽器上註冊 Service Worker（排除 localhost 開發環境）
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .catch(() => {
        // 靜默失敗即可，不影響主流程
      });
  });
}

createApp({
  setup() {
    const view = ref('assets');
    const subView = ref(null);
    const isLoading = ref(false);
    const db = ref({ assets: [], fixedExpenses: [] });
    const newItem = ref({
      name: '',
      value: null,
      symbol: '',
      shares: null,
    });

    const editingId = ref(null);
    const editForm = ref({});

    // Fixed expenses
    const expenseFilter = ref('all');
    const newExpense = ref({ name: '', amount: null, frequency: 'monthly' });
    const editingExpenseId = ref(null);
    const editExpenseForm = ref({});

    // Variable expense mode
    const addExpenseMode = ref('fixed');
    const newVariableExpense = ref({
      name: '',
      frequency: 'monthly',
      amount: null,
    });
    const newRecordAmounts = ref({});

    const {
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
    } = useAssets(db, isLoading);

    const {
      getItems: getExpenseItems,
      addExpense,
      removeExpense,
      updateExpense,
      addRecord,
      removeRecord,
      monthlyTotal,
      yearlyTotal,
      quarterlyTotal,
      yearlyItems,
      semiannualItems,
      quarterlyItems,
      bimonthlyItems,
      monthlyItems,
      FREQ_LABEL,
      FREQ_MONTHS,
    } = useFixedExpenses(db);

    const { updateChart } = useChart(
      view,
      subView,
      isLiability,
      getGroupTotal,
    );

    function handleAddItem(section) {
      if (!newItem.value.name || !newItem.value.value) return;
      addItem(section, subView.value, {
        name: newItem.value.name,
        value: newItem.value.value,
      });
      newItem.value.name = '';
      newItem.value.value = null;
    }

    async function handleAddTWStock() {
      if (!newItem.value.symbol || !newItem.value.shares) return;
      const ok = await addTWStock(newItem.value.symbol, newItem.value.shares);
      if (ok) {
        newItem.value.symbol = '';
        newItem.value.shares = null;
      }
    }

    function startEdit(item) {
      editingId.value = item.id;
      editForm.value = {
        name: item.name,
        value: item.value,
        shares: item.shares || null,
        symbol: item.symbol || '',
      };
    }

    function cancelEdit() {
      editingId.value = null;
      editForm.value = {};
    }

    async function saveEdit(item) {
      if (item.type === 'stock_tw') {
        const shares = editForm.value.shares;
        if (!shares || shares <= 0) return;
        const updates = { shares };
        if (item.currentPrice) {
          updates.value = item.currentPrice * shares;
        }
        updateItem('assets', item.id, updates);
      } else {
        const name = editForm.value.name;
        const value = editForm.value.value;
        if (!name || value == null) return;
        updateItem('assets', item.id, { name, value });
      }
      editingId.value = null;
      editForm.value = {};
    }

    // --- Fixed Expense handlers ---

    function handleAddExpense() {
      const { name, amount, frequency } = newExpense.value;
      if (!name || !amount) return;
      addExpense({ name, amount, frequency });
      newExpense.value = { name: '', amount: null, frequency: 'monthly' };
    }

    function startEditExpense(item) {
      editingExpenseId.value = item.id;
      editExpenseForm.value = {
        name: item.name,
        amount: item.amount,
        frequency: item.frequency,
        type: item.type || 'fixed',
        records: item.records ? [...item.records] : [],
      };
    }

    function cancelEditExpense() {
      editingExpenseId.value = null;
      editExpenseForm.value = {};
    }

    function saveEditExpense(item) {
      const form = editExpenseForm.value;
      if (!form.name) return;
      if (form.type === 'variable') {
        updateExpense(item.id, { name: form.name });
      } else {
        if (!form.amount) return;
        updateExpense(item.id, {
          name: form.name,
          amount: form.amount,
          frequency: form.frequency,
        });
      }
      editingExpenseId.value = null;
      editExpenseForm.value = {};
    }

    // --- Variable expense helpers ---

    function handleAddVariableExpense() {
      const { name, frequency, amount } = newVariableExpense.value;
      if (!name) return;
      const records = [];
      let perPeriodAvg = 0;
      if (amount && amount > 0) {
        records.push({ amount, date: new Date().toISOString().slice(0, 10) });
        perPeriodAvg = amount;
      }
      addExpense({ name, amount: perPeriodAvg, frequency, type: 'variable', records });
      newVariableExpense.value = { name: '', frequency, amount: null };
    }

    function handleAddRecord(itemId) {
      const amount = newRecordAmounts.value[itemId];
      if (!amount || amount <= 0) return;
      addRecord(itemId, amount);
      newRecordAmounts.value[itemId] = null;
    }

    // --- Persistence & chart sync ---

    onMounted(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed.fixedExpenses) parsed.fixedExpenses = [];
          // 清理舊資料中可能出現的無效紀錄，避免 rec 為 null
          if (Array.isArray(parsed.fixedExpenses)) {
            parsed.fixedExpenses.forEach((exp) => {
              if (Array.isArray(exp.records)) {
                exp.records = exp.records.filter(
                  (r) => r && r.date && typeof r.amount === 'number',
                );
              }
            });
          }
          db.value = parsed;
        } catch {
          /* corrupt data – start fresh */
        }
      }
      nextTick(updateChart);
    });

    watch(
      db,
      () => localStorage.setItem(STORAGE_KEY, JSON.stringify(db.value)),
      { deep: true },
    );

    watch([db, view, subView], () => nextTick(updateChart), { deep: true });

    return {
      view,
      subView,
      db,
      newItem,
      isLoading,
      editingId,
      editForm,
      typeMap: ASSET_TYPES,
      typeColors: ASSET_COLORS,
      totalAssets,
      totalLiabilities,
      netWorth,
      isLiability,
      getGroupItems,
      getGroupTotal,
      getCount,
      formatNumber,
      formatShortNumber,
      addItem: handleAddItem,
      addTWStock: handleAddTWStock,
      syncAllStockPrices,
      removeItem,
      startEdit,
      cancelEdit,
      saveEdit,
      // Fixed expenses
      expenseFilter,
      newExpense,
      editingExpenseId,
      editExpenseForm,
      getExpenseItems,
      handleAddExpense,
      removeExpense,
      startEditExpense,
      cancelEditExpense,
      saveEditExpense,
      monthlyTotal,
      yearlyTotal,
      quarterlyTotal,
      yearlyItems,
      semiannualItems,
      quarterlyItems,
      bimonthlyItems,
      monthlyItems,
      FREQ_LABEL,
      // Variable expense mode
      addExpenseMode,
      newVariableExpense,
      handleAddVariableExpense,
      newRecordAmounts,
      handleAddRecord,
      removeRecord,
      FREQ_MONTHS,
    };
  },
}).mount('#app');
