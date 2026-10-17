(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const money = value => {
    if (!Number.isFinite(value)) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const numberValue = id => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const n = Number(String(el.value).replace(/[$,\s]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const calculate = () => {
    const oldTotal = numberValue('calc-old-total');
    const newTotal = numberValue('calc-new-total');
    const oldLand = numberValue('calc-old-land');
    const newLand = numberValue('calc-new-land');

    const dollarIncrease = newTotal - oldTotal;
    const percentIncrease = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0;
    const landPercent = oldLand > 0 ? ((newLand - oldLand) / oldLand) * 100 : 0;

    const dollarEl = document.getElementById('calc-dollar');
    const percentEl = document.getElementById('calc-percent');
    const landEl = document.getElementById('calc-land-percent');
    if (dollarEl) dollarEl.textContent = money(dollarIncrease);
    if (percentEl) percentEl.textContent = `${percentIncrease.toFixed(1)}%`;
    if (landEl) landEl.textContent = `${landPercent.toFixed(1)}%`;

    const summary = document.getElementById('calc-summary');
    if (summary) {
      if (oldTotal > 0 && newTotal > 0) {
        summary.textContent = `Your total assessment changed from ${money(oldTotal)} to ${money(newTotal)}, an increase of ${money(dollarIncrease)} (${percentIncrease.toFixed(1)}%).`;
      } else {
        summary.textContent = 'Enter your old and new totals to calculate the change.';
      }
    }
  };

  ['calc-old-total','calc-new-total','calc-old-land','calc-new-land'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();

  const copyButton = document.getElementById('copy-summary');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const summary = document.getElementById('calc-summary')?.textContent || '';
      try {
        await navigator.clipboard.writeText(summary);
        copyButton.textContent = 'Copied';
        setTimeout(() => copyButton.textContent = 'Copy summary', 1600);
      } catch {
        copyButton.textContent = 'Copy failed';
      }
    });
  }

  const form = document.getElementById('assessment-form');
  if (form) {
    const syncHiddenPercent = () => {
      const oldValue = Number((form.elements['previous_total']?.value || '').replace(/[$,\s]/g, '')) || 0;
      const newValue = Number((form.elements['new_total']?.value || '').replace(/[$,\s]/g, '')) || 0;
      const pct = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0;
      if (form.elements['percent_change']) form.elements['percent_change'].value = pct.toFixed(2);
    };
    ['previous_total','new_total'].forEach(name => {
      const el = form.elements[name];
      if (el) el.addEventListener('input', syncHiddenPercent);
    });
    form.addEventListener('submit', syncHiddenPercent);
  }

  document.querySelectorAll('[data-print]').forEach(btn => {
    btn.addEventListener('click', () => window.print());
  });
})();
