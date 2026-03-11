import { computed } from 'vue';
import { generateId } from '../utils.js';

const FREQ_LABEL = {
  yearly: '年繳',
  semiannual: '半年繳',
  quarterly: '季繳',
  bimonthly: '雙月繳',
  monthly: '月繳',
};
const FREQ_MONTHS = {
  yearly: 12,
  semiannual: 6,
  quarterly: 3,
  bimonthly: 2,
  monthly: 1,
};

export function useFixedExpenses(db) {
  function getItems(filter) {
    const list = db.value.fixedExpenses || [];
    if (!filter || filter === 'all') return list;
    return list.filter((i) => i.frequency === filter);
  }

  function addExpense({ name, amount, frequency, type, records }) {
    if (!db.value.fixedExpenses) db.value.fixedExpenses = [];
    const expense = { id: generateId(), name, amount, frequency };
    if (type === 'variable') {
      expense.type = 'variable';
      expense.records = records || [];
    }
    db.value.fixedExpenses.unshift(expense);
  }

  function removeExpense(id) {
    if (!confirm('確定刪除此固定開支？')) return;
    db.value.fixedExpenses = db.value.fixedExpenses.filter((i) => i.id !== id);
  }

  function updateExpense(id, updates) {
    const idx = (db.value.fixedExpenses || []).findIndex((i) => i.id === id);
    if (idx === -1) return;
    db.value.fixedExpenses[idx] = { ...db.value.fixedExpenses[idx], ...updates };
  }

  const monthlyTotal = computed(() =>
    (db.value.fixedExpenses || []).reduce(
      (sum, i) => sum + i.amount / FREQ_MONTHS[i.frequency],
      0,
    ),
  );

  const yearlyTotal = computed(() => monthlyTotal.value * 12);

  const quarterlyTotal = computed(() => monthlyTotal.value * 3);

  function addRecord(id, amount) {
    const idx = (db.value.fixedExpenses || []).findIndex((i) => i.id === id);
    if (idx === -1) return;
    const item = db.value.fixedExpenses[idx];
    if (!item.records) item.records = [];

    item.records.unshift({
      amount,
      date: new Date().toISOString().slice(0, 10),
    });

    const maxRecords = item.frequency === 'bimonthly' ? 6 : 12;
    if (item.records.length > maxRecords) {
      item.records.length = maxRecords;
    }

    const valid = item.records.filter(
      (r) => r && typeof r.amount === 'number' && r.amount > 0,
    );
    item.amount =
      valid.length > 0
        ? Math.round(valid.reduce((s, r) => s + r.amount, 0) / valid.length)
        : 0;
  }

  function removeRecord(id, index) {
    const list = db.value.fixedExpenses || [];
    const item = list.find((i) => i.id === id);
    if (!item || !Array.isArray(item.records)) return;
    item.records.splice(index, 1);

    const valid = item.records.filter(
      (r) => r && typeof r.amount === 'number' && r.amount > 0,
    );
    item.amount =
      valid.length > 0
        ? Math.round(valid.reduce((s, r) => s + r.amount, 0) / valid.length)
        : 0;
  }

  const yearlyItems = computed(() => getItems('yearly'));
  const semiannualItems = computed(() => getItems('semiannual'));
  const quarterlyItems = computed(() => getItems('quarterly'));
  const bimonthlyItems = computed(() => getItems('bimonthly'));
  const monthlyItems = computed(() => getItems('monthly'));

  return {
    getItems,
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
  };
}
