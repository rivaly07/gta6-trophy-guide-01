// Offline, framework-free trophy guide. The only requests are same-origin data files.
const $ = id => document.getElementById(id);
const storeKey = 'gta6-field-guide:v1';
const categories = { story: 'Story', side: 'Side jobs', activities: 'Activities', mastery: 'Mastery', secrets: 'Secrets', robberies: 'Robberies', money: 'Money & properties', opportunistic: 'One-offs' };
// App-side metadata keyed by the starter's numeric trophy IDs. The starter JSON stays untouched.
const meta = {
  1: { category: 'opportunistic', hidden: false }, 2: { category: 'story', hidden: false }, 3: { category: 'story', hidden: false }, 4: { category: 'story', hidden: false }, 5: { category: 'story', hidden: false }, 6: { category: 'story', hidden: false }, 7: { category: 'story', hidden: false }, 8: { category: 'story', hidden: false }, 9: { category: 'story', hidden: false }, 10: { category: 'story', hidden: false }, 11: { category: 'story', hidden: false }, 12: { category: 'story', hidden: false }, 13: { category: 'story', hidden: false }, 14: { category: 'mastery', hidden: false }, 15: { category: 'activities', hidden: false }, 16: { category: 'activities', hidden: false }, 17: { category: 'activities', hidden: false }, 18: { category: 'activities', hidden: false }, 19: { category: 'activities', hidden: false }, 20: { category: 'activities', hidden: false }, 21: { category: 'activities', hidden: false }, 22: { category: 'side', hidden: false }, 23: { category: 'side', hidden: false }, 24: { category: 'side', hidden: false }, 25: { category: 'side', hidden: false }, 26: { category: 'side', hidden: false }, 27: { category: 'side', hidden: false }, 28: { category: 'side', hidden: false, missable: true }, 29: { category: 'side', hidden: false }, 30: { category: 'activities', hidden: false }, 31: { category: 'activities', hidden: false }, 32: { category: 'activities', hidden: false }, 33: { category: 'side', hidden: false }, 34: { category: 'robberies', hidden: false }, 35: { category: 'activities', hidden: false }, 36: { category: 'mastery', hidden: false }, 37: { category: 'secrets', hidden: false }, 38: { category: 'secrets', hidden: false }, 39: { category: 'robberies', hidden: false }, 40: { category: 'robberies', hidden: false }, 41: { category: 'robberies', hidden: false }, 42: { category: 'activities', hidden: false }, 43: { category: 'robberies', hidden: false }, 44: { category: 'secrets', hidden: true }, 45: { category: 'secrets', hidden: true }, 46: { category: 'robberies', hidden: true }, 47: { category: 'secrets', hidden: true }, 48: { category: 'secrets', hidden: true }, 49: { category: 'secrets', hidden: true }, 50: { category: 'secrets', hidden: true }, 51: { category: 'secrets', hidden: true }, 52: { category: 'money', hidden: false }, 53: { category: 'money', hidden: false }, 54: { category: 'money', hidden: false }, 55: { category: 'side', hidden: false },
};
const gradeOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const infer = s => s.replace(/^(Strongly inferred|Inferred|Likely|Expected|Suggested|Start by|For readability|Leave this one)/, 'Author inference: $1');

async function load() {
  const [t, g] = await Promise.all(['data/trophies.json', 'data/guides.json'].map(u => fetch(u).then(r => { if (!r.ok) throw Error(`${u}: ${r.status}`); return r.json(); })));
  return { trophies: t.trophies, guides: g.guides };
}
function isHidden(t, earned, spoilers) { return t.hidden && !earned.has(t.id) && !spoilers; }
async function main() {
  let data;
  try { data = await load(); } catch (e) { $('results-count').textContent = 'Could not load local data: ' + e.message; console.error(e); return; }
  const { trophies: raw, guides } = data;
  const trophies = raw.map(t => { const g = guides[String(t.id)], existing = t, m = meta[t.id]; const id = String(t.id); const guide = g; return { ...existing, id, category: existing.category ?? m?.category ?? 'opportunistic', hidden: existing.hidden_override ?? m?.hidden ?? false, missable: existing.missable ?? m?.missable ?? false, online: existing.online ?? false, difficulty: existing.difficulty ?? 5, estimated_hours_to_get: existing.estimated_hours_to_get ?? existing.time_to_platinum ?? 1, steps: guide?.steps || [] }; });
  const byId = new Map(trophies.map(t => [t.id, t]));
  const state = { q: '', grade: 'all', category: 'all', missable: 'all', earned: 'all', spoilers: false, tab: 'trophies' };
  const safe = localStorage.getItem(storeKey); let parsed = {};
  try { parsed = safe ? JSON.parse(safe) : {}; } catch { localStorage.removeItem(storeKey); }
  const earned = new Set((parsed.earned || []).filter(id => byId.has(id)));
  let lastFocus = null, toastTimer;
  function save() { try { localStorage.setItem(storeKey, JSON.stringify({ version: 1, earned: [...earned], view: { spoilers: state.spoilers }, updatedAt: new Date().toISOString() })); } catch { toast('Progress stays in memory: storage is unavailable'); } }
  state.spoilers = parsed.view?.spoilers === true;
  $('spoilers').checked = state.spoilers;

  function updateProgress() {
    const total = trophies.length, n = [...earned].filter(id => byId.has(id)).length, pct = total ? Math.round(100 * n / total) : 0;
    $('progress-text').innerHTML = `<strong>${n} / ${total}</strong> trophies earned`;
    $('percent').textContent = `${pct}%`; $('progress-fill').style.width = `${pct}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(pct));
    for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
      const all = trophies.filter(t => t.grade === grade), got = all.filter(t => earned.has(t.id)).length;
      $(`count-${grade}`).textContent = `${got} / ${all.length}`;
    }
    $('toast').textContent = '';
  }
  function toast(msg) { $('toast').textContent = msg; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2200); }
  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    save(); updateProgress(); renderTrophies(); renderRoadmap();
  }

  function matches(t) {
    const g = guides[String(t.id)];
    const text = `${t.name} ${t.description} ${t.guide} ${g?.summary ?? ''} ${(g?.steps || []).join(' ')}`.toLowerCase();
    return (!state.q || text.includes(state.q)) && (state.grade === 'all' || t.grade === state.grade) && (state.category === 'all' || t.category === state.category) && (state.missable === 'all' || String(t.missable) === state.missable) && (state.earned === 'all' || String(earned.has(t.id)) === state.earned);
  }
  function setChips(group, valueKey, attr) {
    $(group).querySelectorAll('.chip').forEach(b => { const yes = b.dataset.value === state[attr]; b.classList.toggle('active', yes); b.setAttribute('aria-pressed', String(yes)); });
  }
  function renderTrophies() {
    const list = $('trophy-list'); list.replaceChildren();
    const shown = trophies.filter(matches).sort((a, b) => Number(a.id) - Number(b.id));
    $('results-count').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
    $('empty').hidden = shown.length > 0;
    for (const t of shown) {
      const g = guides[t.id], e = earned.has(t.id), hidden = isHidden(t, earned, state.spoilers);
      const card = el('button', `trophy-card ${t.grade}${e ? ' is-earned' : ''}`);
      card.type = 'button'; card.dataset.id = t.id;
      card.setAttribute('aria-label', `Open ${hidden ? 'hidden trophy' : t.name} guide${e ? ', earned' : ''}`);
      card.append(el('span', 'earned-box', ' '));
      const mid = el('div', 'card-mid');
      mid.append(el('h3', 'card-title', hidden ? 'Hidden trophy — reveal to view' : (hidden === false && state.spoilers && !e && t.hidden ? '◈ ' : '') + t.name));
      const meta = el('div', 'meta'); meta.append(el('span', `grade ${t.grade}`, t.grade[0].toUpperCase() + t.grade.slice(1)), el('span', 'tag', categories[t.category]));
      if (t.hidden) meta.append(el('span', 'tag', 'Hidden'));
      if (t.missable) meta.append(el('span', 'tag warn', 'Potential missable'));
      if (e) meta.append(el('span', 'tag good', 'Earned'));
      if (t.online) meta.append(el('span', 'tag', 'Online'));
      mid.append(meta);
      mid.append(el('p', `desc${hidden ? ' redacted' : ''}`, hidden ? 'Complete the story steps or toggle “Reveal spoilers” to see this entry.' : t.description));
      card.append(mid);
      const side = el('div', 'card-side'); side.append(el('strong', '', `~${t.estimated_hours_to_get} h`), el('span', '', g?.steps?.length ? `${g.steps.length} guide steps` : 'Guide unavailable'), el('span', '', `Tier ${t.difficulty}/10`)); card.append(side);
      card.addEventListener('click', () => openGuide(t.id)); list.append(card);
    }
    updateProgress(); setChips('grade-filters', 'grade', 'grade'); setChips('category-filters', 'category', 'category'); setChips('missable-filters', 'missable', 'missable'); setChips('earned-filters', 'earned', 'earned');
  }

  function openGuide(id) {
    const t = byId.get(String(id)), g = guides[String(id)]; if (!t || !g) return;
    lastFocus = document.activeElement; const e = earned.has(id), hidden = isHidden(t, earned, state.spoilers);
    const c = $('dialog-content'); c.replaceChildren();
    const head = el('p', 'eyebrow', `${t.grade.toUpperCase()} · ${categories[t.category]}${t.missable ? ' · POTENTIAL MISSABLE' : ''}`); c.append(head);
    c.append(el('h2', '', hidden ? 'Hidden trophy' : t.name));
    const title = c.querySelector('h2'); title.id = 'dialog-title';
    const tags = el('div', 'tags'); tags.append(el('span', 'tag', `Difficulty ${t.difficulty}/10`), el('span', 'tag', `~${t.estimated_hours_to_get} h`), el('span', 'tag', t.online ? 'Online' : 'Single-player')); c.append(tags);
    c.append(el('p', 'official', hidden ? 'Official description hidden until earned or spoilers are enabled.' : t.description));
    c.append(el('h3', '', 'Field procedure'));
    const ol = el('ol', 'steps');
    for (const step of g.steps) { const li = el('li'); li.append(el('span', 'step-label', 'Step')); const txt = hidden ? 'This step is protected. Earn the trophy or turn on spoilers to read it.' : infer(step); li.append(txt); ol.append(li); }
    c.append(ol);
    c.append(el('h3', '', 'Why this matters')); c.append(el('p', '', hidden ? 'Unlock the trophy or reveal spoilers to read the summary.' : g.summary));
    const flags = el('div', 'tags'); if (g.character) flags.append(el('span', 'tag', g.character)); if (g.chapter_gate) flags.append(el('span', 'tag', g.chapter_gate)); if (g.missable_note) flags.append(el('span', 'tag warn', g.missable_note)); c.append(flags);
    c.append(el('h3', '', 'Sources'));
    const ul = el('ul', 'sources'); for (const src of g.sources) { const li = el('li', '', src); ul.append(li); } c.append(ul);
    const note = el('p', '', 'Guide language condensed by the author; no unverified secret is presented as confirmed.'); c.append(note);
    $('dialog-earned').textContent = e ? 'Mark unearned' : 'Mark earned';
    $('dialog-earned').onclick = () => { toggleEarned(id); $('guide-dialog').close(); };
    $('dialog-source-note').textContent = `${g.sources.length} sources · ${hidden ? 'Spo­iler-safe' : 'Guide visible'}`;
    $('guide-dialog').showModal();
  }

  function roadmap() {
    // Assign each trophy once by data order; completed-story gates control later stages.
    const group = (...ids) => ids.map(id => byId.get(String(id))).filter(Boolean);
    const stages = [
      { n: 1, title: 'Leonida basics', desc: 'Finish Gone Fishing, take the Chapter 1 balcony meditation, and meet the early activity vendors.', entries: group(2, 3, 17, 20, 21, 22, 24, 27, 30) },
      { n: 2, title: 'Story spine & side businesses', desc: 'Clear Chapters 2–5 and finish the character-specific jobs as they become available.', entries: group(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 23, 25, 26, 28, 29, 31, 32, 34, 35, 36, 37, 39, 40) },
      { n: 3, title: 'Skill circuit & robberies', desc: 'Finish ranges, races, gang operations, heists and money goals while every business is open.', entries: group(33, 38, 41, 42, 43, 44, 45, 47, 48, 49) },
      { n: 4, title: 'The Leonida census', desc: 'Finish clear-map exploration, targeted collectibles and the remaining opportunities plus unverified secrets.', entries: group(46, 50, 51, 52, 53, 54, 55) },
      { n: 5, title: 'Final audit & platinum', desc: 'Close out the 100% checklist and the final platinum trophy. Manual saves are still your safety net.', entries: group(14, 1) },
    ];
    return stages.map(s => {
      const wrap = el('section', 'stage'); const idx = el('div', 'stage-index', String(s.n).padStart(2, '0'));
      const body = el('div', 'stage-body'); body.append(el('p', 'kicker', `STAGE ${s.n}`), el('h3', '', s.title), el('p', '', s.desc));
      const items = el('div', 'stage-items');
      for (const t of s.entries) { const hidden = isHidden(t, earned, state.spoilers); const it = el('button', 'stage-item'); it.type = 'button'; it.append(el('strong', '', hidden ? 'Hidden trophy' : t.name), el('small', '', `${t.grade} · ${t.estimated_hours_to_get} h${earned.has(t.id) ? ' · earned' : ''}`)); it.onclick = () => openGuide(t.id); items.append(it); }
      body.append(items); wrap.append(idx, body); return wrap;
    });
  }
  function renderRoadmap() { const root = $('roadmap'); root.replaceChildren(...roadmap()); }

  $('show-roadmap').onclick = () => setTab('roadmap');
  $('tab-trophies').onclick = () => setTab('trophies'); $('tab-roadmap').onclick = () => setTab('roadmap');
  function setTab(tab) { state.tab = tab; $('trophy-view').hidden = tab !== 'trophies'; $('roadmap-view').hidden = tab !== 'roadmap'; $('tab-trophies').classList.toggle('active', tab === 'trophies'); $('tab-trophies').setAttribute('aria-selected', String(tab === 'trophies')); $('tab-roadmap').classList.toggle('active', tab === 'roadmap'); $('tab-roadmap').setAttribute('aria-selected', String(tab === 'roadmap')); if (tab === 'roadmap') $('roadmap-view').scrollIntoView({ block: 'start' }); }
  const groups = [['grade-filters', 'grade'], ['category-filters', 'category'], ['missable-filters', 'missable'], ['earned-filters', 'earned']];
  for (const [gid, key] of groups) $(gid).addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; state[key] = b.dataset.value; renderTrophies(); });
  $('search').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); renderTrophies(); });
  $('spoilers').addEventListener('change', e => { state.spoilers = e.target.checked; save(); renderTrophies(); renderRoadmap(); });
  function clearFilters() { state.q = ''; state.grade = 'all'; state.category = 'all'; state.missable = 'all'; state.earned = 'all'; $('search').value = ''; renderTrophies(); }
  $('clear-filters').onclick = clearFilters; $('empty-reset').onclick = clearFilters;
  $('dialog-close').onclick = () => $('guide-dialog').close();
  $('guide-dialog').addEventListener('click', e => { if (e.target === $('guide-dialog')) $('guide-dialog').close(); });
  $('guide-dialog').addEventListener('close', () => { if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); });
  $('reset-progress').onclick = async () => { if (!confirm('Reset earned trophies on this device?')) return; earned.clear(); save(); updateProgress(); renderTrophies(); renderRoadmap(); toast('Earned progress reset'); };
  document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement !== $('search')) { e.preventDefault(); $('search').focus(); } if (e.key === 'Escape' && $('guide-dialog').open) $('guide-dialog').close(); });
  renderTrophies(); renderRoadmap(); setTab('trophies');
}
main().catch(err => { console.error(err); $('results-count').textContent = 'Guide failed to initialize: ' + err.message; });
