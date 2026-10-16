/* ==========================================================================
   CV Creator — app.js
   App orchestration: paste JSON, validate, live preview, export, autosave.
   Three actions in the panel: Copy prompt · Paste JSON · Export PDF.
   ========================================================================== */

const APP_ID = 'cv-creator-draft';
const PROMPT_FILE = 'PROMPT.md';

const els = {
  jsonInput: document.getElementById('json-input'),
  status: document.getElementById('status'),
  assetStatus: document.getElementById('asset-status'),
  previewCanvas: document.getElementById('preview-canvas'),
  exportBtn: document.getElementById('export-btn'),
  clearBtn: document.getElementById('clear-btn'),
  copyPromptBtn: document.getElementById('copy-prompt-btn'),
};

let currentDoc = null;
let currentAssets = {}; // uploaded name -> object URL
let autosaveTimer = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  Assets.init({ onChange: (assets) => { currentAssets = assets; onAssetsChanged(); } });

  // Copy prompt
  els.copyPromptBtn.addEventListener('click', async () => {
    try {
      const text = await fetchPrompt();
      await navigator.clipboard.writeText(text);
      flashButton(els.copyPromptBtn, 'Copied!');
    } catch (e) {
      setStatus('bad', 'Could not load the prompt kit.');
    }
  });

  // Paste JSON
  els.jsonInput.addEventListener('input', (e) => {
    const raw = e.target.value.trim();
    scheduleAutosave(raw);

    if (!raw) {
      currentDoc = null;
      clearPreview();
      setStatus('', '');
      setAssetNotice(null);
      Assets.markUsed([]);
      return;
    }

    try {
      currentDoc = JSON.parse(raw);
    } catch (err) {
      currentDoc = null;
      clearPreview();
      setStatus('bad', 'Invalid JSON: ' + err.message);
      setAssetNotice(null);
      Assets.markUsed([]);
      return;
    }

    validateAndRender();
  });

  // Export — blocked while referenced files are missing
  els.exportBtn.addEventListener('click', () => {
    if (!currentDoc) {
      setStatus('bad', 'Paste your CV JSON first.');
      els.jsonInput.focus();
      return;
    }
    const missing = missingAssets(currentDoc);
    if (missing.length) {
      showMissingNotice(missing);
      return;
    }
    window.print();
  });

  // Clear
  els.clearBtn.addEventListener('click', () => {
    els.jsonInput.value = '';
    currentDoc = null;
    currentAssets = {};
    Assets.clear();
    Assets.markUsed([]);
    clearPreview();
    setStatus('', '');
    setAssetNotice(null);
    localStorage.removeItem(APP_ID);
  });

  // Load autosaved draft
  const saved = localStorage.getItem(APP_ID);
  if (saved) {
    els.jsonInput.value = saved;
    try {
      currentDoc = JSON.parse(saved);
      validateAndRender();
    } catch (e) { /* ignore corrupt draft */ }
  }
});

// --- Prompt kit ---
async function fetchPrompt() {
  const r = await fetch(PROMPT_FILE);
  if (!r.ok) throw new Error('prompt not found');
  return r.text();
}

// --- Validate + render ---
function validateAndRender() {
  const result = CVValidator.validate(currentDoc);

  if (!result.valid) {
    clearPreview();
    setStatus('bad', summarise(result.errors));
    setAssetNotice(null);
    Assets.markUsed([]);
    return;
  }

  const refs = referencedAssets(currentDoc);
  const missing = refs.filter(ref => !resolveAssetUrl(ref));

  // Let the asset list mark which uploads are actually in use.
  Assets.markUsed(refs);

  setStatus('ok', 'Valid CV JSON.');
  if (missing.length) showMissingNotice(missing);
  else setAssetNotice(null);

  render();
}

function render() {
  try {
    const cv = Render.render(currentDoc, resolveAssetUrl);
    els.previewCanvas.innerHTML = '';
    els.previewCanvas.className = 'preview-canvas preview-mode';
    els.previewCanvas.appendChild(cv);
  } catch (err) {
    clearPreview();
    setStatus('bad', 'Preview failed: ' + err.message);
  }
}

function clearPreview() {
  els.previewCanvas.innerHTML = '';
  els.previewCanvas.className = 'preview-canvas';
}

// A new upload arrived — re-evaluate missing files and re-render.
function onAssetsChanged() {
  if (!currentDoc) { Assets.markUsed([]); return; }
  validateAndRender();
}

// --- Asset references (basename, case-insensitive) ---
function referencedAssets(doc) {
  const refs = [];
  if (doc && doc.basics && doc.basics.photo) refs.push(doc.basics.photo);
  return refs;
}

function resolveAssetUrl(reference) {
  if (!reference) return null;
  const want = Assets.normalize(reference);
  for (const name in currentAssets) {
    if (Assets.normalize(name) === want) return currentAssets[name];
  }
  return null;
}

function missingAssets(doc) {
  return referencedAssets(doc).filter(ref => !resolveAssetUrl(ref));
}

// --- Single missing-file notice (lives in the photo step) ---
function showMissingNotice(missing) {
  const names = missing.map(m => '<strong>' + escapeHtml(Assets.basename(m)) + '</strong>');
  const msg = missing.length > 1
    ? 'Missing ' + names.join(', ') + ' — add them above.'
    : 'Your JSON references ' + names[0] + ' — add it above.';
  setAssetNotice(msg);
}

function setAssetNotice(html) {
  if (!els.assetStatus) return;
  els.assetStatus.className = 'asset-status';
  els.assetStatus.innerHTML = html || '';
}

// --- Status line ---
function setStatus(kind, msg) {
  if (!els.status) return;
  els.status.className = 'validation' + (kind ? ' ' + kind : '');
  els.status.textContent = msg || '';
}

function summarise(errors) {
  const shown = errors.slice(0, 5).map(e => (e.path || 'root') + ': ' + e.message);
  let s = 'Invalid CV JSON — ' + shown.join(' · ');
  if (errors.length > 5) s += ' (+' + (errors.length - 5) + ' more)';
  return s;
}

// --- Autosave ---
function scheduleAutosave(raw) {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (raw && raw.trim()) localStorage.setItem(APP_ID, raw);
  }, 1000);
}

// --- Helpers ---
function flashButton(btn, label) {
  const old = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = old; }, 1200);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]);
}
