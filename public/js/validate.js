/* ==========================================================================
   CV Creator — validate.js
   Lightweight contract validation for cv.schema.json.
   Produces agent-readable error messages (path + expected + got).
   No external dependencies — keeps the app dependency-free and private.
   ========================================================================== */

const CVValidator = (() => {
  const KINDS = [
    'experience', 'education', 'skills', 'projects', 'certifications',
    'languages', 'interests', 'text', 'awards', 'publications'
  ];

  const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
  const DATE_RE = /^\d{4}(-\d{2})?$/;

  const errors = [];

  function add(path, msg) {
    errors.push({ path, message: msg });
  }

  function isStr(v) { return typeof v === 'string'; }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function isBool(v) { return typeof v === 'boolean'; }
  function isArr(v) { return Array.isArray(v); }
  function isObj(v) { return v !== null && typeof v === 'object' && !isArr(v); }

  function checkType(path, value, expected) {
    if (expected === 'string' && !isStr(value)) { add(path, `expected string, got ${typeof value === 'undefined' ? 'missing' : typeof value}`); return false; }
    if (expected === 'number' && !isNum(value)) { add(path, `expected number, got ${typeof value}`); return false; }
    if (expected === 'boolean' && !isBool(value)) { add(path, `expected boolean, got ${typeof value}`); return false; }
    if (expected === 'array' && !isArr(value)) { add(path, `expected array, got ${isObj(value) ? 'object' : typeof value}`); return false; }
    if (expected === 'object' && !isObj(value)) { add(path, `expected object, got ${isArr(value) ? 'array' : typeof value}`); return false; }
    return true;
  }

  function requireField(obj, key, path) {
    if (!(key in obj)) { add(path + (path ? '.' : '') + key, 'required field missing'); return false; }
    return true;
  }

  function validateColor(path, value) {
    if (!isStr(value) || !COLOR_RE.test(value)) add(path, `expected hex color (#RRGGBB), got "${value}"`);
  }

  function validateTheme(t, path) {
    if (!isObj(t)) { add(path, 'theme must be an object'); return; }

    const f = t.fonts;
    if (f) {
      if (f.heading && !['Fraunces','Inter','JetBrains Mono','EB Garamond','Space Grotesk','Source Serif'].includes(f.heading))
        add(path + '.fonts.heading', `invalid font "${f.heading}"`);
      if (f.body && !['Fraunces','Inter','JetBrains Mono','EB Garamond','Space Grotesk','Source Serif'].includes(f.body))
        add(path + '.fonts.body', `invalid font "${f.body}"`);
      if (f.headingWeight !== undefined && (f.headingWeight < 100 || f.headingWeight > 900 || !Number.isInteger(f.headingWeight)))
        add(path + '.fonts.headingWeight', 'must be integer 100-900');
    }

    const c = t.colors;
    if (c) {
      ['accent','accent2','text','muted','panel','rule','page'].forEach(k => {
        if (c[k] !== undefined) validateColor(path + '.colors.' + k, c[k]);
      });
    }

    const l = t.layout;
    if (l) {
      if (l.paper !== undefined && !['A4','Letter'].includes(l.paper)) add(path + '.layout.paper', 'must be A4 or Letter');
      if (l.photo !== undefined && !['left','right','top','none'].includes(l.photo)) add(path + '.layout.photo', 'must be left/right/top/none');
      if (l.columns !== undefined && (l.columns < 0 || l.columns > 50 || !Number.isInteger(l.columns))) add(path + '.layout.columns', 'must be integer 0-50');
      if (l.density !== undefined && !['compact','normal','airy'].includes(l.density)) add(path + '.layout.density', 'must be compact/normal/airy');
      if (l.fontSize !== undefined && (l.fontSize < 8 || l.fontSize > 13)) add(path + '.layout.fontSize', 'must be 8-13');
      if (l.sideStyle !== undefined && !['panel','plain','rule'].includes(l.sideStyle)) add(path + '.layout.sideStyle', 'must be panel/plain/rule');
    }

    const d = t.decor;
    if (d) {
      if (d.sectionStyle !== undefined && !['rule','bar','none'].includes(d.sectionStyle)) add(path + '.decor.sectionStyle', 'must be rule/bar/none');
      if (d.skills !== undefined && !['bar','dots','chip','plain'].includes(d.skills)) add(path + '.decor.skills', 'must be bar/dots/chip/plain');
      if (d.photoShape !== undefined && !['circle','rounded','square'].includes(d.photoShape)) add(path + '.decor.photoShape', 'must be circle/rounded/square');
      if (d.pageNumbers !== undefined && !isBool(d.pageNumbers)) add(path + '.decor.pageNumbers', 'must be boolean');
    }
  }

  function validateBasics(b, path) {
    if (!isObj(b)) { add(path, 'basics must be an object'); return; }
    if (!requireField(b, 'name', path)) return;
    if (b.name !== undefined && !isStr(b.name)) add(path + '.name', 'must be string');
    ['headline','summary','location','summaryShort','photo'].forEach(k => {
      if (b[k] !== undefined && !isStr(b[k])) add(path + '.' + k, 'must be string');
    });
  }

  function validateContact(c, path) {
    if (!isArr(c)) { add(path, 'contact must be an array'); return; }
    c.forEach((item, i) => {
      const p = path + '[' + i + ']';
      if (!isObj(item)) { add(p, 'must be object'); return; }
      if (!requireField(item, 'label', p)) return;
      if (item.label !== undefined && !isStr(item.label)) add(p + '.label', 'must be string');
      if (item.icon !== undefined && !['email','phone','location','linkedin','github','web','twitter','portfolio'].includes(item.icon))
        add(p + '.icon', 'invalid icon');
      if (item.href !== undefined && !isStr(item.href)) add(p + '.href', 'must be string');
    });
  }

  function validateItem(it, path, kind) {
    if (!isObj(it)) { add(path, 'must be object'); return; }
    if (!requireField(it, 'role', path)) return;
    if (it.role !== undefined && !isStr(it.role)) add(path + '.role', 'must be string');
    ['org','location','label','summary','url','icon','color'].forEach(k => {
      if (it[k] !== undefined && !isStr(it[k])) add(path + '.' + k, 'must be string');
    });
    if (it.start !== undefined && !DATE_RE.test(it.start)) add(path + '.start', 'must be YYYY or YYYY-MM');
    if (it.end !== undefined && !DATE_RE.test(it.end) && it.end !== 'Present') add(path + '.end', 'must be YYYY, YYYY-MM, or "Present"');
    if (it.level !== undefined && (it.level < 0 || it.level > 100 || !Number.isInteger(it.level))) add(path + '.level', 'must be integer 0-100');
    if (it.highlights !== undefined && !isArr(it.highlights)) add(path + '.highlights', 'must be array of strings');
    if (it.tech !== undefined && !isArr(it.tech)) add(path + '.tech', 'must be array of strings');
    if (it.color !== undefined && !COLOR_RE.test(it.color)) add(path + '.color', 'expected hex color');
  }

  function validateSections(s, path) {
    if (!isArr(s)) { add(path, 'sections must be an array'); return; }
    s.forEach((sec, i) => {
      const p = path + '[' + i + ']';
      if (!isObj(sec)) { add(p, 'must be object'); return; }
      if (!requireField(sec, 'kind', p)) return;
      if (!requireField(sec, 'items', p)) return;
      if (sec.kind !== undefined && !KINDS.includes(sec.kind)) add(p + '.kind', `invalid kind "${sec.kind}"`);
      if (sec.title !== undefined && !isStr(sec.title)) add(p + '.title', 'must be string');
      if (sec.column !== undefined && !['main','side','full'].includes(sec.column)) add(p + '.column', 'must be main/side/full');
      if (sec.html !== undefined && !isStr(sec.html)) add(p + '.html', 'must be string');

      if (isArr(sec.items)) {
        sec.items.forEach((it, j) => validateItem(it, p + '.items[' + j + ']', sec.kind));
      }
    });
  }

  function validate(doc) {
    errors.length = 0;
    if (!isObj(doc)) { add('', 'document must be a JSON object'); return { valid: false, errors: [{ path: '', message: 'document must be a JSON object' }] }; }

    if (doc.version !== undefined && doc.version !== 1) add('version', 'must be 1');

    if (doc.meta) {
      if (doc.meta.generatedBy !== undefined && !isStr(doc.meta.generatedBy)) add('meta.generatedBy', 'must be string');
      if (doc.meta.generatedAt !== undefined && !isStr(doc.meta.generatedAt)) add('meta.generatedAt', 'must be ISO8601 string');
    }

    if (doc.theme) validateTheme(doc.theme, 'theme');
    if (doc.labels) {
      const t = doc.labels;
      if (t.present !== undefined && !isStr(t.present)) add('labels.present', 'must be string');
      const tt = t.titles;
      if (tt) {
        ['experience','education','skills','projects','certifications','languages','interests'].forEach(k => {
          if (tt[k] !== undefined && !isStr(tt[k])) add('labels.titles.' + k, 'must be string');
        });
      }
    }

    if (doc.basics) validateBasics(doc.basics, 'basics');
    if (doc.contact) validateContact(doc.contact, 'contact');
    if (doc.sections) validateSections(doc.sections, 'sections');

    return { valid: errors.length === 0, errors };
  }

  function formatForAgent(errors) {
    if (errors.length === 0) return null;
    const lines = errors.map(e => `- ${e.path || 'root'}: ${e.message}`);
    return 'Your CV JSON has validation errors. Fix these and paste again:\n' + lines.join('\n');
  }

  return { validate, formatForAgent };
})();
