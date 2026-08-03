const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'projects.json');

// Credenciais do painel (podem ser sobrescritas por variáveis de ambiente no Railway)
const AUTH_USER = process.env.PAINEL_USER || 'ti@padapagronegocios.com.br';
const AUTH_PASS = process.env.PAINEL_PASS || 'Padap@123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'painel-padap-secret-' + crypto.randomBytes(8).toString('hex');

const STATUS_VALUES = ['Online', 'Em testes', 'Em desenvolvimento', 'Pausado'];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12 // 12 horas
  }
}));

// --- Helpers de dados ---
function readProjects() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

// --- Middleware de autenticação ---
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  return res.redirect('/login.html');
}

// --- Rotas de autenticação ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === AUTH_USER && password === AUTH_PASS) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// --- Arquivos públicos (login) ---
app.get('/login.html', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// --- Página principal protegida ---
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API de projetos (protegida) ---
app.get('/api/projects', requireAuth, (req, res) => {
  const projects = readProjects().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(projects);
});

app.post('/api/projects', requireAuth, (req, res) => {
  const { name, version, createdAt, status, url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
  }
  if (!STATUS_VALUES.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const projects = readProjects();
  const newProject = {
    id: crypto.randomUUID(),
    name: name.trim(),
    version: (version || '').trim(),
    createdAt: createdAt || new Date().toISOString().slice(0, 10),
    status,
    url: (url || '').trim()
  };
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const projects = readProjects();
  const filtered = projects.filter(p => p.id !== req.params.id);
  if (filtered.length === projects.length) {
    return res.status(404).json({ error: 'Projeto não encontrado' });
  }
  writeProjects(filtered);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Painel Padap rodando na porta ${PORT}`);
});
