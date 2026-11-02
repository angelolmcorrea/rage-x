const KEY = 'raivas';
const lista = document.getElementById('lista');

async function render() {
  const data = await chrome.storage.local.get(KEY);
  const itens = data[KEY] || [];
  lista.textContent = '';
  if (!itens.length) {
    const p = document.createElement('p');
    p.className = 'vazio';
    p.textContent = 'Nenhuma raiva guardada.';
    lista.appendChild(p);
    return;
  }
  for (const it of itens) {
    const div = document.createElement('div');
    div.className = 'item';
    const d = document.createElement('div');
    d.className = 'data';
    d.textContent = new Date(it.data).toLocaleString('pt-BR');
    const t = document.createElement('div');
    t.className = 'texto';
    t.textContent = it.texto;
    const b = document.createElement('button');
    b.textContent = 'Apagar';
    b.addEventListener('click', async () => {
      const cur = (await chrome.storage.local.get(KEY))[KEY] || [];
      await chrome.storage.local.set({ [KEY]: cur.filter((x) => x.id !== it.id) });
      render();
    });
    div.append(d, t, b);
    lista.appendChild(div);
  }
}
render();
