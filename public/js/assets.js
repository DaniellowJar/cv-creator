/* ==========================================================================
   CV Creator — assets.js
   Photo/file drop zone. Produces object URLs that live only in the current
   browser session — nothing is uploaded anywhere.

   Matching: a JSON reference like "assets/me.jpg" matches an uploaded file by
   basename, case-insensitively ("me.jpg", "ME.JPG", "assets/me.jpg" all match).
   ========================================================================== */

const Assets = (() => {
  const files = new Map(); // name -> { file, url, kind }
  let used = new Set();    // normalized names currently referenced by the CV
  let onChange = () => {};

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const assetList = document.getElementById('asset-list');

  function basename(p) { return String(p).replace(/\\/g, '/').split('/').pop(); }
  function normalize(p) { return basename(p).trim().toLowerCase(); }

  function init(opts) {
    if (opts && typeof opts.onChange === 'function') onChange = opts.onChange;

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      handleFiles(Array.from(e.target.files));
      fileInput.value = ''; // allow re-selecting the same file
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleFiles(Array.from(e.dataTransfer.files));
    });
  }

  function handleFiles(fileList) {
    let added = 0;
    for (const file of fileList) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) continue;
      const existing = files.get(file.name);
      if (existing) URL.revokeObjectURL(existing.url);
      files.set(file.name, {
        file,
        url: URL.createObjectURL(file),
        kind: file.type.startsWith('image/') ? 'image' : 'file'
      });
      added++;
    }
    if (added) {
      renderList();
      onChange(getAll());
    }
  }

  function remove(name) {
    const entry = files.get(name);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      files.delete(name);
    }
    renderList();
    onChange(getAll());
  }

  function clear() {
    for (const [, entry] of files) URL.revokeObjectURL(entry.url);
    files.clear();
    renderList();
    onChange({});
  }

  function getAll() {
    return Object.fromEntries([...files.entries()].map(([k, v]) => [k, v.url]));
  }

  // Mark which uploaded files are actually referenced by the current CV.
  function markUsed(refs) {
    used = new Set((refs || []).map(normalize));
    renderList();
  }

  function renderList() {
    if (!assetList) return;
    assetList.innerHTML = '';
    for (const [name, entry] of files) {
      const isUsed = used.has(normalize(name));
      const div = document.createElement('div');
      div.className = 'asset-item' + (isUsed ? ' matched' : '');
      const thumb = entry.kind === 'image'
        ? `<img src="${entry.url}" alt="">`
        : `<div class="asset-file-icon">PDF</div>`;
      div.innerHTML = `
        ${thumb}
        <div class="asset-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        ${isUsed ? '<span class="asset-badge">used as photo</span>' : ''}
        <button class="asset-remove" aria-label="Remove ${escapeHtml(name)}" data-name="${escapeHtml(name)}">×</button>
      `;
      div.querySelector('.asset-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        remove(name);
      });
      assetList.appendChild(div);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]);
  }

  return { init, getAll, clear, remove, markUsed, normalize, basename };
})();
