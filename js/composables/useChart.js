import { ASSET_TYPES, ASSET_COLORS } from '../constants.js';

export function useChart(view, subView, isLiability, getGroupTotal) {
  let chartInstance = null;

  function update() {
    const canvas = document.getElementById('assetChart');
    if (!canvas || view.value !== 'assets' || subView.value) return;

    const activeTypes = Object.keys(ASSET_TYPES).filter(
      (t) => !isLiability(t) && getGroupTotal(t) > 0,
    );

    if (chartInstance) chartInstance.destroy();

    /* global Chart */
    chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: activeTypes.map((t) => ASSET_TYPES[t]),
        datasets: [
          {
            data: activeTypes.map((t) => getGroupTotal(t)),
            backgroundColor: activeTypes.map((t) => ASSET_COLORS[t]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: '75%',
        plugins: { legend: { display: false } },
      },
    });
  }

  return { updateChart: update };
}
