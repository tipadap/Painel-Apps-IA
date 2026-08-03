const STATUS_CONFIG = {
  'Online':               { dot: 'signal-dot--online',  accent: '#4FD1C5', pillBg: 'rgba(79, 209, 197, 0.14)',  pillColor: '#4FD1C5' },
  'Em testes':            { dot: 'signal-dot--teste',    accent: '#F2B84B', pillBg: 'rgba(242, 184, 75, 0.14)',  pillColor: '#F2B84B' },
  'Em desenvolvimento':   { dot: 'signal-dot--dev',      accent: '#6C8CFF', pillBg: 'rgba(108, 140, 255, 0.14)', pillColor: '#6C8CFF' },
  'Pausado':              { dot: 'signal-dot--pausado',  accent: '#6B7680', pillBg: 'rgba(107, 118, 128, 0.14)', pillColor: '#8B99A3' }
};

const board = document.getElementById('board');
const summaryRow = document.getElementById('summary-row');
const emptyState = document.getElementById('empty-state');

const modalOverlay = document.getElementById('modal-overlay');
const projectForm = document.getElementById('project-form');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmName = document.getElementById('confirm-name');
const confirmDeleteBtn = document.getElementById('confirm-delete');

let projects = [];
let pendingDeleteId = null;

// ---------- Carregamento ----------
async function loadProjects() {
  const res = await fetch('/api/projects');
  if (res.status === 401) {
    window.location.href = '/login.html';
    return;
  }
  projects = await res.json();
  renderSummary();
  renderBoard();
}

function renderSummary() {
  const statuses = Object.keys(STATUS_CONFIG);
  summaryRow.innerHTML = statuses.map(status => {
    const count = projects.filter(p => p.status === status).length;
    const cfg = STATUS_CONFIG[status];
    return `
      <div class="summary-chip">
        <span class="signal-dot ${cfg.dot}"></span>
        ${status} <strong>${count}</strong>
      </div>`;
  }).join('');
}

function renderBoard() {
  if (projects.length === 0) {
    board.innerHTML = '';
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  board.innerHTML = projects.map(p => {
    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['Pausado'];
    const linkHtml = p.url
      ? `<a class="card-link" href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.url)}</a>`
      : `<span class="card-link card-link--empty">Sem link cadastrado</span>`;

    return `
      <article class="project-card" style="--card-accent:${cfg.accent}">
        <div class="card-top">
          <h3 class="card-name">${escapeHtml(p.name)}</h3>
          <span class="status-pill" style="--pill-bg:${cfg.pillBg}; --pill-color:${cfg.pillColor}">
            <span class="signal-dot ${cfg.dot}"></span>${p.status}
          </span>
        </div>
        <div class="card-meta">
          <span>ver <strong>${escapeHtml(p.version || '—')}</strong></span>
          <span>criado em <strong>${formatDate(p.createdAt)}</strong></span>
        </div>
        ${linkHtml}
        <div class="card-footer">
          <button class="card-delete" data-id="${p.id}" data-name="${escapeAttr(p.name)}">Excluir</button>
        </div>
      </article>`;
  }).join('');

  document.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', () => openConfirm(btn.dataset.id, btn.dataset.name));
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// ---------- Modal: novo projeto ----------
document.getElementById('btn-open-modal').addEventListener('click', () => {
  projectForm.reset();
  document.getElementById('p-date').value = new Date().toISOString().slice(0, 10);
  modalOverlay.hidden = false;
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

function closeModal() { modalOverlay.hidden = true; }

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(projectForm);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal();
    await loadProjects();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Não foi possível salvar o projeto.');
  }
});

// ---------- Modal: confirmação de exclusão ----------
function openConfirm(id, name) {
  pendingDeleteId = id;
  confirmName.textContent = name;
  confirmOverlay.hidden = false;
}
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });
function closeConfirm() { confirmOverlay.hidden = true; pendingDeleteId = null; }

confirmDeleteBtn.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  const res = await fetch(`/api/projects/${pendingDeleteId}`, { method: 'DELETE' });
  closeConfirm();
  if (res.ok) {
    await loadProjects();
  } else {
    alert('Não foi possível excluir o projeto.');
  }
});

// ---------- Logout ----------
document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

// ---------- Init ----------
loadProjects();
