const numberFmt = new Intl.NumberFormat();

export const formatNumber = (n) => numberFmt.format(Math.round(n || 0));

export const formatShortNumber = (n) => {
  const val = n || 0;
  return val >= 10000 ? `${(val / 10000).toFixed(1)}萬` : numberFmt.format(val);
};

export const generateId = () => Date.now();

export const todayString = () => new Date().toLocaleDateString();
