// Seletores do X num único lugar: se o X mudar o DOM, ajusta aqui.
const SEL = {
  postButtons: '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]',
  textarea: '[data-testid="tweetTextarea_0"]',
  toolBar: '[data-testid="toolBar"]',
};
const KEY = 'raivas';

function findComposerRoot(postBtn) {
  // sobe até achar um ancestral que contenha a caixa de texto
  let el = postBtn.parentElement;
  while (el && el !== document.body) {
    if (el.querySelector(SEL.textarea)) return el;
    el = el.parentElement;
  }
  return null;
}

function readText(box) {
  return (box.innerText || '').replace(/​/g, '').trim();
}

function clearBox(box) {
  // Draft.js: trocar textContent quebra o estado; usar seleção + delete.
  box.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'rage-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('rage-toast-out'), 2200);
  setTimeout(() => t.remove(), 2800);
}

async function save(texto) {
  const data = await chrome.storage.local.get(KEY);
  const lista = data[KEY] || [];
  lista.unshift({ id: Date.now().toString(36), texto, data: new Date().toISOString() });
  await chrome.storage.local.set({ [KEY]: lista });
}

// Filho direto de `row` que contém `el`.
function childOf(row, el) {
  let a = el;
  while (a && a.parentElement !== row) a = a.parentElement;
  return a;
}

function makeButton(postBtn) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'rage-btn';
  btn.textContent = 'Rage';
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const root = findComposerRoot(postBtn);
    const box = root && root.querySelector(SEL.textarea);
    if (!box) return;
    const texto = readText(box);
    if (!texto) return;
    await save(texto);
    clearBox(box);
    toast('Sua raiva foi aliviada');
  });
  return btn;
}

// Linha onde o Rage entra: a barra de ferramentas do composer.
function findRow(postBtn) {
  const bar = postBtn.closest(SEL.toolBar);
  if (bar) return bar;
  // fallback: primeiro ancestral que tem mais de um filho
  let el = postBtn.parentElement;
  while (el && el.children.length === 1) el = el.parentElement;
  return el;
}

function ensure(postBtn) {
  // Ignora Postar invisível (o X mantém cópias ocultas no DOM).
  const r = postBtn.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const row = findRow(postBtn);
  if (!row) return;
  const anchor = childOf(row, postBtn);
  if (!anchor) return;
  // Já existe um Rage logo antes do Postar nesta linha.
  const prev = anchor.previousElementSibling;
  if (prev && prev.classList.contains('rage-btn')) return;
  const btn = makeButton(postBtn);
  row.insertBefore(btn, anchor);
  btn.style.height = r.height + 'px';
}

function cleanStrays() {
  // Rage fora de uma linha com Postar visível (sobra de re-render do X).
  document.querySelectorAll('.rage-btn').forEach((b) => {
    const next = b.nextElementSibling;
    const ok = next && (next.matches(SEL.postButtons) || next.querySelector(SEL.postButtons));
    if (!ok) b.remove();
  });
}

function scan() {
  cleanStrays();
  document.querySelectorAll(SEL.postButtons).forEach(ensure);
}

new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
scan();
