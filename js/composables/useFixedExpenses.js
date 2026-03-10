import { computed } from 'vue';
import { generateId } from '../utils.js';

const FREQ_LABEL = { yearly: '年繳', quarterly: '季繳', monthly: '月繳' };
const FREQ_MONTHS = { yearly: 12, quarterly: 3, monthly: 1 };

export function useFixedExpenses(db) {
  function getItems(filter) {
    const list = db.value.fixedExpenses || [];
    if (!filter || filter === 'all') return list;
    return list.filter((i) => i.frequency === filter);
  }

  function addExpense({ name, amount, frequency }) {
    if (!db.value.fixedExpenses) db.value.fixedExpenses = [];
    db.value.fixedExpenses.unshift({
      id: generateId(),
      name,
      amount,
      frequency,
    });
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

  const yearlyItems = computed(() => getItems('yearly'));
  const quarterlyItems = computed(() => getItems('quarterly'));
  const monthlyItems = computed(() => getItems('monthly'));

  return {
    getItems,
    addExpense,
    removeExpense,
    updateExpense,
    monthlyTotal,
    yearlyTotal,
    quarterlyTotal,
    yearlyItems,
    quarterlyItems,
    monthlyItems,
    FREQ_LABEL,
    FREQ_MONTHS,
  };
}
