/* ==========================================================================
   CV Creator — render.js
   Builds the full CV DOM from the JSON contract. Injects theme values as CSS
   custom properties on <body> so cv.css drives everything.
   ========================================================================== */

const Render = (() => {
  const THEME_DEFAULTS = {
    paper: 'A4',
    fonts: { heading: 'Fraunces', body: 'Inter', headingWeight: 600 },
    colors: { accent: '#B4F204', accent2: '#FFD60A', text: '#1F2937', muted: '#6B7280', panel: '#FFFFFF', rule: '#E5E7EB', page: '#FAFAF7' },
    layout: { photo: 'left', columns: 30, density: 'normal', fontSize: 10.2, sideStyle: 'panel' },
    decor: { sectionStyle: 'rule', skills: 'bar', photoShape: 'circle', pageNumbers: true }
  };

  let currentDoc = null;

  function mergeDefaults(theme) {
    const t = JSON.parse(JSON.stringify(THEME_DEFAULTS));
    if (!theme) return t;
    if (theme.paper) t.paper = theme.paper;
    if (theme.fonts) {
      if (theme.fonts.heading) t.fonts.heading = theme.fonts.heading;
      if (theme.fonts.body) t.fonts.body = theme.fonts.body;
      if (theme.fonts.headingWeight !== undefined) t.fonts.headingWeight = theme.fonts.headingWeight;
    }
    if (theme.colors) Object.assign(t.colors, theme.colors);
    if (theme.layout) Object.assign(t.layout, theme.layout);
    if (theme.decor) Object.assign(t.decor, theme.decor);
    return t;
  }

  function applyThemeVars(theme) {
    const c = theme.colors;
    const l = theme.layout;
    const f = theme.fonts;
    document.documentElement.style.setProperty('--cv-accent', c.accent);
    document.documentElement.style.setProperty('--cv-accent2', c.accent2);
    document.documentElement.style.setProperty('--cv-text', c.text);
    document.documentElement.style.setProperty('--cv-muted', c.muted);
    document.documentElement.style.setProperty('--cv-panel', c.panel);
    document.documentElement.style.setProperty('--cv-rule', c.rule);
    document.documentElement.style.setProperty('--cv-page', c.page);
    document.documentElement.style.setProperty('--cv-font-heading', `'${f.heading}', system-ui, sans-serif`);
    document.documentElement.style.setProperty('--cv-font-body', `'${f.body}', system-ui, sans-serif`);
    document.documentElement.style.setProperty('--cv-heading-weight', f.headingWeight);
    document.documentElement.style.setProperty('--cv-font-size', l.fontSize + 'pt');
    document.documentElement.style.setProperty('--cv-columns', l.columns + '%');

    document.body.classList.toggle('cv-dark', (c.page === '#0F172A' || c.page === '#000000') && !c.page.includes('FA'));
    document.body.classList.toggle('cv-light', !document.body.classList.contains('cv-dark'));

    // density class
    document.body.className = document.body.className.replace(/cv-density-\w+/, '');
    document.body.classList.add('cv-density-' + l.density);
  }

  function buildHeader(doc) {
    const b = doc.basics || {};
    const header = document.createElement('div');
    header.className = 'cv-header';

    // Photo is added below via buildPhoto()

    const info = document.createElement('div');
    info.className = 'cv-info';

    if (b.name) {
      const name = document.createElement('h1');
      name.className = 'cv-name';
      name.textContent = b.name;
      info.appendChild(name);
    }
    if (b.headline) {
      const h = document.createElement('div');
      h.className = 'cv-headline';
      h.textContent = b.headline;
      info.appendChild(h);
    } else if (b.summaryShort) {
      const h = document.createElement('div');
      h.className = 'cv-headline';
      h.textContent = b.summaryShort;
      info.appendChild(h);
    }
    if (b.summary) {
      const s = document.createElement('p');
      s.className = 'cv-summary';
      s.textContent = b.summary;
      info.appendChild(s);
    }
    if (b.location) {
      const loc = document.createElement('div');
      loc.className = 'cv-location';
      loc.textContent = b.location;
      info.appendChild(loc);
    }

    header.appendChild(info);

    // Contact row
    if (doc.contact && doc.contact.length) {
      const contact = document.createElement('div');
      contact.className = 'cv-contact';
      doc.contact.forEach((c, i) => {
        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'sep';
          sep.textContent = '·';
          contact.appendChild(sep);
        }
        const item = document.createElement('span');
        item.textContent = c.label;
        if (c.href) {
          const a = document.createElement('a');
          a.href = c.href;
          a.textContent = c.label;
          contact.appendChild(a);
        } else {
          contact.appendChild(item);
        }
      });
      header.appendChild(contact);
    }

    return header;
  }

  function buildPhoto(doc, getAssetUrl) {
    const b = doc.basics || {};
    if (!b.photo || doc.theme.layout.photo === 'none') return null;

    const photo = document.createElement('img');
    photo.className = 'cv-photo ' + doc.theme.layout.photo + ' ' + (doc.theme.decor.photoShape || 'circle');
    const url = getAssetUrl(b.photo);
    if (url) photo.src = url;
    else photo.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTVFNzdFIi8+PC9zdmc+';
    photo.alt = 'Photo';
    return photo;
  }

  function render(doc, getAssetUrl) {
    currentDoc = doc;
    const theme = mergeDefaults(doc.theme);
    applyThemeVars(theme);
    Sections.setLabels(doc.labels);

    const container = document.createElement('div');
    container.className = 'cv-sheet ' + theme.paper.toLowerCase();
    container.setAttribute('data-page', '1');

    // Determine page count for multi-page (simple: one sheet for now; could paginate)
    const page = document.createElement('div');
    page.className = 'cv-page';

    // Header
    const header = buildHeader(doc);
    const photo = buildPhoto(doc, getAssetUrl);

    if (photo) {
      if (theme.layout.photo === 'top') {
        page.appendChild(photo);
      } else {
        header.insertBefore(photo, header.firstChild);
      }
    }

    if (header.children.length) page.appendChild(header);

    // Columns
    const hasSide = theme.layout.columns > 0;
    if (hasSide) {
      const columns = document.createElement('div');
      columns.className = 'cv-columns';

      const main = document.createElement('div');
      main.className = 'cv-main';
      const side = document.createElement('div');
      side.className = 'cv-side';

      (doc.sections || []).forEach(sec => {
        const rendered = Sections.renderSection(sec, theme);
        if (sec.column === 'side' && hasSide) side.appendChild(rendered);
        else main.appendChild(rendered);
      });

      columns.appendChild(main);
      columns.appendChild(side);
      page.appendChild(columns);
    } else {
      const main = document.createElement('div');
      main.className = 'cv-main';
      (doc.sections || []).forEach(sec => {
        const rendered = Sections.renderSection(sec, theme);
        main.appendChild(rendered);
      });
      page.appendChild(main);
    }

    container.appendChild(page);
    return container;
  }

  function updateTheme(theme) {
    applyThemeVars(mergeDefaults(theme));
    if (currentDoc) {
      // Re-render handled by app.js
    }
  }

  return { render, updateTheme, mergeDefaults };
})();
