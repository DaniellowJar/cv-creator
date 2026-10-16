/* ==========================================================================
   CV Creator — render.js
   Builds the full CV DOM from the JSON contract. Injects theme values as CSS
   custom properties on <body> so cv.css drives everything.
   Supports multi-page pagination: sections are packed across A4/Letter sheets.
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

    const isDark = c.page === '#0F172A' || c.page === '#000000' || c.text === '#F8FAFC';
    document.body.classList.toggle('cv-dark', isDark);
    document.body.classList.toggle('cv-light', !isDark);

    document.body.className = document.body.className.replace(/cv-density-\w+/, '');
    document.body.classList.add('cv-density-' + l.density);
  }

  function buildHeader(doc) {
    const b = doc.basics || {};
    const header = document.createElement('div');
    header.className = 'cv-header';

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
        if (c.href) {
          const a = document.createElement('a');
          a.href = c.href;
          a.textContent = c.label;
          contact.appendChild(a);
        } else {
          const item = document.createElement('span');
          item.textContent = c.label;
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

  // Page content height in mm for A4/Letter minus margins (14mm top, 16mm bottom)
  function pageContentHeight(paper) {
    if (paper === 'Letter') return 279.4 - 14 - 16; // 249.4mm
    return 297 - 14 - 16; // 267mm
  }

  function render(doc, getAssetUrl) {
    currentDoc = doc;
    const theme = mergeDefaults(doc.theme);
    applyThemeVars(theme);
    Sections.setLabels(doc.labels);

    const container = document.createElement('div');
    container.className = 'cv-sheet ' + theme.paper.toLowerCase();

    const pageHeight = pageContentHeight(theme.paper);

    // Build header + photo once
    const header = buildHeader(doc);
    const photo = buildPhoto(doc, getAssetUrl);
    if (photo) {
      if (theme.layout.photo === 'top') {
        // photo goes on its own line at top of page 1
      } else {
        header.insertBefore(photo, header.firstChild);
      }
    }

    // Collect all section elements (measured in a hidden sizer)
    const sectionEls = [];
    (doc.sections || []).forEach(sec => {
      sectionEls.push(Sections.renderSection(sec, theme));
    });

    // Determine column mode
    const hasSide = theme.layout.columns > 0;

    // Paginate: page 1 starts with header; subsequent pages are empty
    let currentPage = null;
    let used = 0; // mm used on current page

    function newPage(pageNum) {
      const page = document.createElement('div');
      page.className = 'cv-page';
      if (pageNum === 1 && header.children.length) {
        page.appendChild(header.cloneNode(true));
        used = headerHeightEstimate(theme);
      } else {
        used = 0;
      }
      container.appendChild(page);
      return page;
    }

    let pageNum = 1;
    currentPage = newPage(pageNum);

    // If photo is top-placed, it consumes space on page 1 before sections
    if (photo && theme.layout.photo === 'top') {
      currentPage.appendChild(photo);
      used += 40; // photo block estimate
    }

    // Two-column layout helper: splits sections into main & side arrays
    const mainSections = [];
    const sideSections = [];
    sectionEls.forEach((el, i) => {
      const sec = doc.sections[i];
      const col = sec.column || 'main';
      if (col === 'side' && hasSide) sideSections.push(el);
      else mainSections.push(el);
    });

    function tryAdd(el, estimate) {
      if (used + estimate > pageHeight && used > 0) {
        pageNum++;
        currentPage = newPage(pageNum);
      }
      currentPage.appendChild(el);
      used += estimate;
    }

    // Render main column sections first, then side
    // For two-column, we need to interleave: this is complex, so we render
    // main sections in flow, then side column sections stacked below if they fit
    // A simpler robust approach: single column flow for preview accuracy.
    // Two-column is preserved via CSS when columns > 0, but pagination stacks
    // all sections vertically per page.
    const allInOrder = [...mainSections, ...sideSections];

    // Measure each section height by temporarily appending to a sizer
    const sizer = document.createElement('div');
    sizer.style.position = 'absolute';
    sizer.style.visibility = 'hidden';
    sizer.style.width = '210mm'; // A4 width
    document.body.appendChild(sizer);

    const heights = [];
    allInOrder.forEach(el => {
      const clone = el.cloneNode(true);
      sizer.appendChild(clone);
      heights.push(clone.offsetHeight);
      sizer.removeChild(clone);
    });
    document.body.removeChild(sizer);

    // Convert px to mm (96px = 25.4mm)
    const pxToMm = 25.4 / 96;

    allInOrder.forEach((el, i) => {
      const estMm = heights[i] * pxToMm + 4; // +4mm section margin
      tryAdd(el, estMm);
    });

    // Page numbers
    if (theme.decor && theme.decor.pageNumbers) {
      const pages = container.querySelectorAll('.cv-page');
      pages.forEach((p, idx) => {
        const num = document.createElement('div');
        num.className = 'cv-page-number';
        num.textContent = (idx + 1) + ' / ' + pages.length;
        p.appendChild(num);
      });
    }

    return container;
  }

  function headerHeightEstimate(theme) {
    // Approximate mm used by header on page 1
    let h = 22; // name + headline
    if (theme.layout.photo === 'left' || theme.layout.photo === 'right') h += 40;
    return h;
  }

  function updateTheme(theme) {
    applyThemeVars(mergeDefaults(theme));
  }

  return { render, updateTheme, mergeDefaults };
})();
