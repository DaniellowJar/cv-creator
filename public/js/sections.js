/* ==========================================================================
   CV Creator — sections.js
   Renders each section kind into DOM nodes. Called by render.js.
   ========================================================================== */

const Sections = (() => {
  const LABELS = {
    present: 'Present',
    titles: {
      experience: 'Experience', education: 'Education', skills: 'Skills',
      projects: 'Projects', certifications: 'Certifications',
      languages: 'Languages', interests: 'Interests'
    }
  };

  function setLabels(labels) {
    if (!labels) return;
    if (labels.present) LABELS.present = labels.present;
    if (labels.titles) Object.assign(LABELS.titles, labels.titles);
  }

  function fmtDate(d) {
    if (!d) return '';
    if (d === 'Present') return LABELS.present;
    return d;
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function itemHead(item) {
    const head = el('div', 'cv-item-head');
    if (item.role) {
      const role = el('span', 'cv-item-role', escapeHtml(item.role));
      head.appendChild(role);
    }
    if (item.org) {
      const org = el('span', 'cv-item-org', escapeHtml(item.org));
      head.appendChild(org);
    }
    const meta = [];
    if (item.start || item.end) meta.push(fmtDate(item.start) + (item.end ? ' – ' + fmtDate(item.end) : ''));
    if (item.location) meta.push(item.location);
    if (meta.length) {
      const dates = el('span', 'cv-item-dates', meta.join(' · '));
      head.appendChild(dates);
    }
    return head;
  }

  function highlights(item) {
    if (!item.highlights || item.highlights.length === 0) return null;
    const ul = el('ul', 'cv-item-highlights');
    item.highlights.forEach(h => {
      const li = el('li', null, escapeHtml(h));
      ul.appendChild(li);
    });
    return ul;
  }

  function techChips(item) {
    if (!item.tech || item.tech.length === 0) return null;
    const wrap = el('div', 'cv-item-tech');
    item.tech.forEach(t => {
      const chip = el('span', 'chip', escapeHtml(t));
      wrap.appendChild(chip);
    });
    return wrap;
  }

  function desc(item) {
    if (!item.summary && !item.description) return null;
    const d = el('div', 'cv-item-desc', escapeHtml(item.summary || item.description));
    return d;
  }

  function experience(item) {
    const div = el('div', 'cv-item');
    div.appendChild(itemHead(item));
    if (desc(item)) div.appendChild(desc(item));
    if (highlights(item)) div.appendChild(highlights(item));
    if (techChips(item)) div.appendChild(techChips(item));
    return div;
  }

  function education(item) {
    return experience(item); // same shape
  }

  function projects(item) {
    return experience(item); // same shape
  }

  function certifications(item) {
    return experience(item);
  }

  function awards(item) {
    return experience(item);
  }

  function publications(item) {
    return experience(item);
  }

  function skills(item) {
    const div = el('div', 'cv-item');
    div.appendChild(itemHead(item));
    return div;
  }

  function skillsList(items, style) {
    const ul = el('ul', 'cv-skills-' + style);
    items.forEach(it => {
      const li = el('li');
      if (style === 'bar') {
        li.innerHTML = `<span class="skill-name">${escapeHtml(it.role)}</span>
          <div class="skill-bar"><div class="skill-fill" style="width:${Math.max(0, Math.min(100, it.level || 0))}%"></div></div>
          <div class="skill-label">${escapeHtml(it.label || '')}</div>`;
      } else if (style === 'dots') {
        li.innerHTML = `<div class="dot" style="background:${it.color || ''}"></div>
          <span class="skill-label">${escapeHtml(it.role)}</span>`;
      } else if (style === 'chip') {
        const chip = el('span', 'chip', escapeHtml(it.role));
        if (it.color) chip.style.background = it.color;
        li.appendChild(chip);
      } else {
        li.textContent = it.role;
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function languages(items) {
    const ul = el('ul', 'cv-skills-bar');
    items.forEach(it => {
      const li = el('li');
      li.innerHTML = `<span class="skill-name">${escapeHtml(it.role)}</span>
        <span class="skill-label" style="float:right">${escapeHtml(it.label || '')}</span>
        <div class="skill-bar"><div class="skill-fill" style="width:${Math.max(0, Math.min(100, it.level || 0))}%"></div></div>`;
      ul.appendChild(li);
    });
    return ul;
  }

  function interests(items) {
    const ul = el('ul', 'cv-skills-plain');
    items.forEach(it => {
      const li = el('li', null, escapeHtml(it.role));
      ul.appendChild(li);
    });
    return ul;
  }

  function textSection(sec) {
    const div = el('div', 'cv-text-block', sec.html || '');
    return div;
  }

  const RENDERERS = {
    experience, education, projects, certifications, awards, publications,
    skills, languages, interests, text: textSection
  };

  function renderSection(sec, theme) {
    const section = el('div', 'cv-section');
    const title = el('h2', 'cv-section-title', escapeHtml(sec.title || LABELS.titles[sec.kind] || sec.kind));

    const ds = theme.decor || {};
    if (ds.sectionStyle === 'rule') title.classList.add('rule-style');
    else if (ds.sectionStyle === 'bar') title.classList.add('bar-style');
    else if (ds.sectionStyle === 'none') title.classList.add('none-style');

    section.appendChild(title);

    const col = el('div', 'cv-' + (sec.column || 'main'));
    const renderer = RENDERERS[sec.kind];

    if (sec.kind === 'skills') {
      col.appendChild(skillsList(sec.items, ds.skills || 'bar'));
    } else if (sec.kind === 'languages') {
      col.appendChild(languages(sec.items));
    } else if (sec.kind === 'interests') {
      col.appendChild(interests(sec.items));
    } else if (sec.kind === 'text') {
      col.appendChild(textSection(sec));
    } else if (renderer) {
      sec.items.forEach(it => col.appendChild(renderer(it)));
    }

    section.appendChild(col);
    return section;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]);
  }

  return { renderSection, setLabels };
})();
