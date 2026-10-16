/* ==========================================================================
   CV Creator — app.js
   App orchestration: paste JSON, validate, live preview, export, autosave.
   ========================================================================== */

const APP_ID = 'cv-creator-draft';

const els = {
  jsonInput: document.getElementById('json-input'),
  validation: document.getElementById('validation'),
  previewCanvas: document.getElementById('preview-canvas'),
  exportBtn: document.getElementById('export-btn'),
  clearBtn: document.getElementById('clear-btn'),
  exampleChips: document.getElementById('example-chips'),
  themeAccent: document.getElementById('theme-accent'),
  themeAccent2: document.getElementById('theme-accent2'),
  themeText: document.getElementById('theme-text'),
  themeMuted: document.getElementById('theme-muted'),
  themePanel: document.getElementById('theme-panel'),
  themeRule: document.getElementById('theme-rule'),
  themePage: document.getElementById('theme-page'),
  photoLeft: document.getElementById('photo-left'),
  photoRight: document.getElementById('photo-right'),
  photoTop: document.getElementById('photo-top'),
  photoNone: document.getElementById('photo-none'),
  densitySelect: document.getElementById('density-select'),
  fontSizeInput: document.getElementById('font-size-input'),
  zoomInput: document.getElementById('zoom-input'),
  darkToggle: document.getElementById('dark-toggle'),
  copyJsonBtn: document.getElementById('copy-json'),
};

let currentDoc = null;
let currentAssets = {};
let previewScale = 1;
let autosaveTimer = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  Assets.init({ onChange: (assets) => { currentAssets = assets; scheduleRender(); } });
  Confetti.init();

  // JSON input
  els.jsonInput.addEventListener('input', (e) => {
    const raw = e.target.value.trim();
    if (!raw) { clearPreview(); return; }
    try {
      currentDoc = JSON.parse(raw);
      validateAndRender();
    } catch (err) {
      showValidation('bad', 'Invalid JSON: ' + err.message);
      clearPreview();
    }
    scheduleAutosave(raw);
  });

  // Export
  els.exportBtn.addEventListener('click', () => {
    if (!currentDoc) return;
    Confetti.burst(window.innerWidth / 2, 100);
    setTimeout(() => {
      window.print();
      setTimeout(() => Confetti.stop(), 1500);
    }, 600);
  });

  // Clear
  els.clearBtn.addEventListener('click', () => {
    els.jsonInput.value = '';
    currentDoc = null;
    currentAssets = {};
    Assets.clear();
    clearPreview();
    showValidation('', '');
    localStorage.removeItem(APP_ID);
  });

  // Example chips
  els.exampleChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.example-chip');
    if (!chip) return;
    const name = chip.dataset.example;
    fetch('examples/' + name + '.json')
      .then(r => r.text())
      .then(text => {
        els.jsonInput.value = text;
        currentDoc = JSON.parse(text);
        validateAndRender();
        scheduleAutosave(text);
      });
  });

  // Theme tweaks
  const themeInputs = [els.themeAccent, els.themeAccent2, els.themeText, els.themeMuted, els.themePanel, els.themeRule, els.themePage];
  themeInputs.forEach(input => input.addEventListener('input', updateThemeFromUI));
  els.photoLeft.addEventListener('click', () => setPhoto('left'));
  els.photoRight.addEventListener('click', () => setPhoto('right'));
  els.photoTop.addEventListener('click', () => setPhoto('top'));
  els.photoNone.addEventListener('click', () => setPhoto('none'));
  els.densitySelect.addEventListener('change', updateThemeFromUI);
  els.fontSizeInput.addEventListener('input', updateThemeFromUI);
  els.darkToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('app-dark', e.target.checked);
  });
  els.zoomInput.addEventListener('input', (e) => {
    previewScale = parseFloat(e.target.value);
    els.previewCanvas.style.transform = `scale(${previewScale})`;
    els.previewCanvas.style.transformOrigin = 'top center';
  });

  // Copy JSON
  els.copyJsonBtn.addEventListener('click', () => {
    if (!currentDoc) return;
    navigator.clipboard.writeText(JSON.stringify(currentDoc, null, 2))
      .then(() => { const old = els.copyJsonBtn.textContent; els.copyJsonBtn.textContent = 'Copied!'; setTimeout(() => els.copyJsonBtn.textContent = old, 1200); });
  });

  // Load autosaved draft
  const saved = localStorage.getItem(APP_ID);
  if (saved) {
    try {
      els.jsonInput.value = saved;
      currentDoc = JSON.parse(saved);
      validateAndRender();
    } catch (e) { /* ignore corrupt draft */ }
  }
});

// --- Validate + render ---
function validateAndRender() {
  const result = CVValidator.validate(currentDoc);
  if (result.valid) {
    showValidation('ok', 'Valid CV JSON — ' + (currentDoc.sections || []).length + ' sections');
    doRender();
  } else {
    showValidation('bad', CVValidator.formatForAgent(result.errors));
    clearPreview();
  }
}

function doRender() {
  const getAssetUrl = (name) => currentAssets[name] || null;
  const cv = Render.render(currentDoc, getAssetUrl);
  els.previewCanvas.innerHTML = '';
  els.previewCanvas.className = 'preview-canvas preview-mode';
  els.previewCanvas.appendChild(cv);
}

function scheduleRender() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(doRender, 150);
}

function scheduleAutosave(raw) {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (raw && raw.trim()) localStorage.setItem(APP_ID, raw);
  }, 1000);
}

function clearPreview() {
  els.previewCanvas.innerHTML = '';
  els.previewCanvas.className = 'preview-canvas';
}

// --- Theme UI ---
function updateThemeFromUI() {
  if (!currentDoc) return;
  currentDoc.theme = currentDoc.theme || {};
  currentDoc.theme.colors = currentDoc.theme.colors || {};
  currentDoc.theme.layout = currentDoc.theme.layout || {};

  currentDoc.theme.colors.accent = els.themeAccent.value;
  currentDoc.theme.colors.accent2 = els.themeAccent2.value;
  currentDoc.theme.colors.text = els.themeText.value;
  currentDoc.theme.colors.muted = els.themeMuted.value;
  currentDoc.theme.colors.panel = els.themePanel.value;
  currentDoc.theme.colors.rule = els.themeRule.value;
  currentDoc.theme.colors.page = els.themePage.value;
  currentDoc.theme.layout.density = els.densitySelect.value;
  currentDoc.theme.layout.fontSize = parseFloat(els.fontSizeInput.value);

  Render.updateTheme(currentDoc.theme);
  scheduleRender();
}

function setPhoto(side) {
  if (!currentDoc) return;
  currentDoc.theme.layout = currentDoc.theme.layout || {};
  currentDoc.theme.layout.photo = side;
  [els.photoLeft, els.photoRight, els.photoTop, els.photoNone].forEach(b => b.classList.remove('active'));
  document.getElementById('photo-' + side).classList.add('active');
  scheduleRender();
}

// --- Validation display ---
function showValidation(kind, msg) {
  if (!els.validation) return;
  els.validation.className = 'validation ' + kind;
  els.validation.textContent = msg;
}
