const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      window.location.href = '/';
    } else {
      errorEl.textContent = data.error || 'Usuário ou senha inválidos.';
      errorEl.hidden = false;
    }
  } catch (err) {
    errorEl.textContent = 'Não foi possível conectar ao servidor.';
    errorEl.hidden = false;
  }
});
