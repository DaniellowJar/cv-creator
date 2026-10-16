/* ==========================================================================
   CV Creator — assets.js
   File drop zone + photo asset management. Produces object URLs that live
   only in the current browser session — nothing is uploaded anywhere.
   ========================================================================== */

const Assets = (() => {
  const files = new Map(); // name -> { file, url, kind }

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const assetList = document.getElementById('asset-list');
  const onChange = () => {};

  function init(opts) {
    Object.assign(onChange, opts.onChange);

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      handleFiles(Array.from(e.target.files));
    });

    // Drag over
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
    for (const file of fileList) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) continue;
      const url = URL.createObjectURL(file);
      files.set(file.name, { file, url, kind: file.type.startsWith('image/') ? 'image' : 'file' });
    }
    renderList();
    if (onChange) onChange(getAll());
  }

  function remove(name) {
    const entry = files.get(name);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      files.delete(name);
    }
    renderList();
    if (onChange) onChange(getAll());
  }

  function getUrl(name) { return files.has(name) ? files.get(name).url : null; }
  function getAll() { return Object.fromEntries([...files.entries()].map(([k, v]) => [k, v.url])); }
  function clear() {
    for (const [, v] of files) URL.revokeObjectURL(v.url);
    files.clear();
    renderList();
    if (onChange) onChange({});
  }

  function renderList() {
    if (!assetList) return;
    assetList.innerHTML = '';
    if (files.size === 0) {
      assetList.innerHTML = '<p style="font-size:0.75rem;color:var(--app-muted);text-align:center;padding:1rem;">No files yet</p>';
      return;
    }
    for (const [name, entry] of files) {
      const div = document.createElement('div');
      div.className = 'asset-item';
      div.innerHTML = `
        ${entry.kind === 'image' ? `<img src="${entry.url}" alt="">` : `<div style="width:28px;height:28px;border-radius:4px;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:10px;color:#6B7280;">📄</div>`}
        <div class="asset-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <button class="asset-remove" aria-label="Remove ${escapeHtml(name)}" data-name="${escapeHtml(name)}">×</button>
      `;
      div.querySelector('.asset-remove').addEventListener('click', () => remove(name));
      assetList.appendChild(div);
    }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]); }

  return { init, getUrl, getAll, clear, remove };
})();
