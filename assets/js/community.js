(() => {
  const percent = value => typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Not enough data yet';
  const integer = value => typeof value === 'number' && Number.isFinite(value) ? String(value) : '0';

  const params = new URLSearchParams(window.location.search);
  const confirmation = document.getElementById('submission-confirmation');
  if (confirmation && params.get('submitted') === '1') confirmation.hidden = false;

  const renderTypes = types => {
    const host = document.getElementById('property-types');
    if (!host) return;
    const entries = Object.entries(types || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
    if (!entries.length) {
      host.innerHTML = '<p>No community submissions yet.</p>';
      return;
    }
    host.innerHTML = entries.map(([name, count]) => `<div class="comparison-row"><span>${name}</span><strong>${count}</strong></div>`).join('');
  };

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const load = async () => {
    const status = document.getElementById('dashboard-status');
    try {
      const response = await fetch('/.netlify/functions/community-data', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Dashboard request failed with ${response.status}`);
      const data = await response.json();
      setText('stat-submissions', integer(data.submissions));
      setText('stat-average', percent(data.average_total_percent_change));
      setText('stat-median', percent(data.median_total_percent_change));
      setText('stat-over100', integer(data.properties_over_100_percent));
      setText('stat-land', percent(data.median_land_percent_change));
      setText('stat-openbook', integer(data.planning_open_book));
      setText('lakefront-count', integer(data.lakefront?.count));
      setText('lakefront-median', percent(data.lakefront?.median_percent_change));
      setText('nonlake-count', integer(data.non_lakefront?.count));
      setText('nonlake-median', percent(data.non_lakefront?.median_percent_change));
      setText('contact-count', integer(data.assessor_contact?.contacted));
      setText('noresponse-count', integer(data.assessor_contact?.reported_no_response_or_pending));
      setText('seasonal-count', integer(data.seasonal_properties));
      renderTypes(data.property_types);
      if (status) status.textContent = data.submissions
        ? `Based on ${data.submissions} voluntarily submitted ${data.submissions === 1 ? 'property' : 'properties'}. The dashboard updates as new accepted submissions are processed.`
        : 'No accepted community submissions are in the dashboard yet. Be the first to add one.';
    } catch (error) {
      console.error(error);
      if (status) status.textContent = 'The community dashboard is temporarily unavailable. Please try again shortly.';
    }
  };

  const copyButton = document.getElementById('copy-site-link');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('https://maple-plain-assessment-project.netlify.app/');
        copyButton.textContent = 'Link copied';
        setTimeout(() => copyButton.textContent = 'Copy site link', 1600);
      } catch {
        copyButton.textContent = 'Copy failed';
      }
    });
  }

  load();
})();
