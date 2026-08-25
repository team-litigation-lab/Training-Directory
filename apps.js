(function () {
  const DATA = JSON.parse(document.getElementById('site-data').textContent);

  const ICONS = {
    'video': '&#9654;', 'videos': '&#9654;', 'topic': '&#9654;',
    'canva links': '&#127912;',
    'sop': '&#128220;',
    'activity': '&#9998;',
    'answer key': '&#128273;',
    'training materials': '&#128218;',
  };
  function iconFor(label) {
    const key = label.toLowerCase().replace(/\s*\d+$/, '').trim();
    return ICONS[key] || '&#128279;';
  }

  const tabList = document.getElementById('tabList');
  const contentInner = document.getElementById('contentInner');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuBtn = document.getElementById('menuBtn');
  const searchInput = document.getElementById('searchInput');

  let activeKey = DATA.topics[0].key;

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  function buildTabs() {
    tabList.innerHTML = '';
    DATA.topics.forEach(t => {
      const li = document.createElement('li');
      li.className = 'tab-item';
      li.dataset.key = t.key;
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.innerHTML = `<span class="dot"></span>${t.name}`;
      btn.addEventListener('click', () => selectTopic(t.key));
      li.appendChild(btn);
      tabList.appendChild(li);
    });
    updateActiveTab();
  }

  function updateActiveTab() {
    [...tabList.children].forEach(li => {
      li.classList.toggle('active', li.dataset.key === activeKey);
    });
  }

  function chipHTML(label, val, link, solid) {
    if (!link) {
      return `<span class="chip disabled"><span class="ic">${iconFor(label)}</span>${label}</span>`;
    }
    return `<a class="chip${solid ? ' solid' : ''}" href="${escapeAttr(link)}" title="${escapeAttr(link)}" target="_blank" rel="noopener">
      <span class="ic">${iconFor(label)}</span>${label}</a>`;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dayNumberOf(label, idx) {
    const m = /(\d+)/.exec(label || '');
    return m ? m[1].padStart(2, '0') : String(idx + 1).padStart(2, '0');
  }

  function renderRow(row, idx) {
    const num = dayNumberOf(row.label, idx);
    const cellsHTML = Object.entries(row.cells).map(([label, c]) => chipHTML(label, c.val, c.link)).join('');
    let extraHTML = '';
    if (row.extra && row.extra.length) {
      extraHTML = `<div class="extra-row"><div class="extra-label">Additional resource</div>
        <div class="chip-row">${row.extra.map(e => chipHTML(e.val || 'Resource', e.val, e.link, true)).join('')}</div></div>`;
    }
    return `<div class="day-card">
      <div class="day-num"><span class="no">No.</span><span class="n">${num}</span></div>
      <div class="day-body">
        <p class="day-label">${escapeHTML(row.label || '')}</p>
        <div class="chip-row">${cellsHTML}</div>
        ${extraHTML}
      </div>
    </div>`;
  }

  function renderSection(section) {
    let html = '';
    if (section.title) {
      html += `<div class="subsection-title">${escapeHTML(section.title)}`;
      if (section.title_link) {
        html += `<a class="folder-link" href="${escapeAttr(section.title_link)}" title="${escapeAttr(section.title_link)}" target="_blank" rel="noopener">Open source folder &rarr;</a>`;
      }
      html += `</div>`;
    }
    if (section.rows && section.rows.length) {
      html += `<div class="day-grid">${section.rows.map(renderRow).join('')}</div>`;
    }
    if (section.trailing_links && section.trailing_links.length) {
      html += `<div class="stack-label">Additional resources</div>
        <div class="res-grid">${section.trailing_links.map(l => resCard(l)).join('')}</div>`;
    }
    return html;
  }

  function resCard(l) {
    if (!l.link) {
      return `<span class="res-card" style="opacity:.5;cursor:default;">
        <span class="swatch">&mdash;</span>${escapeHTML(l.label || '')}</span>`;
    }
    const initials = (l.label || '?').trim().slice(0, 2).toUpperCase();
    return `<a class="res-card" href="${escapeAttr(l.link)}" title="${escapeAttr(l.link)}" target="_blank" rel="noopener">
      <span class="swatch">${escapeHTML(initials)}</span>${escapeHTML(l.label || 'Resource')}</a>`;
  }

  function renderTopic(key) {
    const topic = DATA.topics.find(t => t.key === key);
    const sheet = DATA.sheets[key];
    let html = `<div class="page-head">
      <div class="kicker">Training Directory</div>
      <h1>${escapeHTML(topic.name)}</h1>
      <p>${describeSheet(sheet)}</p>
    </div>`;

    const hasSections = sheet.sections && sheet.sections.length;
    const hasNotes = sheet.notes && sheet.notes.length;

    if (!hasSections && !hasNotes) {
      html += `<div class="empty-state">
        <div class="stamp">Not yet filed</div>
        <p>No materials have been added to this folder yet. Check back soon.</p>
      </div>`;
    } else {
      if (hasSections) {
        html += sheet.sections.map(renderSection).join('');
      }
      if (hasNotes) {
        html += `<div class="stack-label">${hasSections ? 'More resources' : 'Resources'}</div>
          <div class="res-grid">${sheet.notes.map(resCard).join('')}</div>`;
      }
    }
    contentInner.innerHTML = html;
    contentInner.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function describeSheet(sheet) {
    const dayCount = (sheet.sections || []).reduce((a, s) => a + (s.rows ? s.rows.length : 0), 0);
    const resCount = (sheet.sections || []).reduce((a, s) => a + (s.trailing_links ? s.trailing_links.length : 0), 0) + (sheet.notes ? sheet.notes.length : 0);
    const parts = [];
    if (dayCount) parts.push(`${dayCount} training day${dayCount === 1 ? '' : 's'}`);
    if (resCount) parts.push(`${resCount} additional resource${resCount === 1 ? '' : 's'}`);
    if (!parts.length) return 'Materials for this folder will be added soon.';
    return parts.join(' &middot; ');
  }

  function selectTopic(key) {
    activeKey = key;
    updateActiveTab();
    renderTopic(key);
    closeSidebar();
    searchInput.value = '';
  }

  function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
  menuBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // ---- Search ----
  function buildSearchIndex() {
    const index = [];
    DATA.topics.forEach(t => {
      const sheet = DATA.sheets[t.key];
      (sheet.sections || []).forEach(s => {
        (s.rows || []).forEach(r => {
          index.push({ topicKey: t.key, topicName: t.name, label: `${s.title ? s.title + ' — ' : ''}${r.label}`, kind: 'day' });
        });
      });
    });
    return index;
  }
  const searchIndex = buildSearchIndex();
  let searchBox = null;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { removeSearchBox(); return; }
    const topicMatches = DATA.topics.filter(t => t.name.toLowerCase().includes(q));
    const rowMatches = searchIndex.filter(r => r.label.toLowerCase().includes(q) || r.topicName.toLowerCase().includes(q)).slice(0, 20);
    showSearchResults(topicMatches, rowMatches, q);
  });

  function removeSearchBox() {
    if (searchBox) { searchBox.remove(); searchBox = null; }
  }

  function showSearchResults(topicMatches, rowMatches, q) {
    removeSearchBox();
    searchBox = document.createElement('div');
    searchBox.style.cssText = `position:absolute; top:52px; right:22px; width:min(360px,90vw); max-height:70vh; overflow-y:auto;
      background:#fff; border:1px solid var(--line); border-radius:10px; box-shadow:var(--shadow); z-index:60; padding:8px;`;
    let html = '';
    if (!topicMatches.length && !rowMatches.length) {
      html = `<div style="padding:16px; color:var(--ink-soft); font-size:13px;">No matches for "${escapeHTML(q)}"</div>`;
    } else {
      if (topicMatches.length) {
        html += `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);padding:8px 10px 4px;">Topics</div>`;
        topicMatches.forEach(t => {
          html += `<div class="search-result" data-key="${t.key}" style="padding:9px 10px;border-radius:7px;cursor:pointer;font-size:13.5px;font-weight:500;">${escapeHTML(t.name)}</div>`;
        });
      }
      if (rowMatches.length) {
        html += `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);padding:8px 10px 4px;">Training days</div>`;
        rowMatches.forEach(r => {
          html += `<div class="search-result" data-key="${r.topicKey}" style="padding:9px 10px;border-radius:7px;cursor:pointer;font-size:13px;">
            <div style="font-weight:500;">${escapeHTML(r.label)}</div>
            <div style="color:var(--ink-soft);font-size:11.5px;">${escapeHTML(r.topicName)}</div></div>`;
        });
      }
    }
    searchBox.innerHTML = html;
    document.querySelector('.topbar').style.position = 'sticky';
    document.querySelector('.topbar').appendChild(searchBox);
    searchBox.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'var(--paper-2)');
      el.addEventListener('mouseleave', () => el.style.background = 'transparent');
      el.addEventListener('click', () => {
        selectTopic(el.dataset.key);
        removeSearchBox();
      });
    });
  }
  document.addEventListener('click', (e) => {
    if (searchBox && !searchBox.contains(e.target) && e.target !== searchInput) removeSearchBox();
  });

  buildTabs();
  renderTopic(activeKey);
})();
