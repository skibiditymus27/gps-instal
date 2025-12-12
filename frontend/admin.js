// Panel administracyjny GPS INSTAL

// W produkcji użyj '/api/admin', w rozwoju pełny URL backendu
const API_BASE = window.location.port === '4173' 
  ? 'http://localhost:3000/api/admin' 
  : '/api/admin';
let authToken = localStorage.getItem('adminToken');

// Elementy DOM
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const requestsContent = document.getElementById('requestsContent');
const detailModal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

// Sprawdź autoryzację przy ładowaniu
if (authToken) {
  showDashboard();
}

// Formularz logowania
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.remove('show');

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('loginBtn');

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logowanie...';

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Logowanie nieudane');

    const data = await res.json();
    authToken = data.token;
    localStorage.setItem('adminToken', authToken);
    showDashboard();
  } catch (err) {
    loginError.classList.add('show');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Zaloguj się';
  }
});

// Wylogowanie
logoutBtn.addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('adminToken');
  showLogin();
});

// Odśwież
refreshBtn.addEventListener('click', loadRequests);

// Eksport CSV
exportBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_BASE}/requests/export`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zapytania-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Błąd podczas eksportu');
  }
});

// Zamknij modal
closeModal.addEventListener('click', () => {
  detailModal.classList.remove('show');
});

detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) {
    detailModal.classList.remove('show');
  }
});

function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  loginForm.reset();
}

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  loadRequests();
}

function handleUnauthorized() {
  authToken = null;
  localStorage.removeItem('adminToken');
  showLogin();
  loginError.textContent = 'Sesja wygasła. Zaloguj się ponownie.';
  loginError.classList.add('show');
}

async function loadRequests() {
  requestsContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Ładowanie danych...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/requests`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();
    updateStats(data.stats);
    renderRequests(data.requests);
  } catch (err) {
    requestsContent.innerHTML = `
      <div class="empty-state">
        <p>Błąd ładowania danych. Spróbuj ponownie.</p>
      </div>
    `;
  }
}

function updateStats(stats) {
  document.getElementById('totalRequests').textContent = stats.total || 0;
  document.getElementById('todayRequests').textContent = stats.today || 0;
  document.getElementById('weekRequests').textContent = stats.week || 0;
}

function renderRequests(requests) {
  if (!requests || requests.length === 0) {
    requestsContent.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>Brak zapytań kontaktowych</p>
      </div>
    `;
    return;
  }

  const table = `
    <table class="requests-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Imię i nazwisko</th>
          <th>E-mail</th>
          <th>Telefon</th>
          <th>Miejscowość</th>
          <th>Wiadomość</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(r => `
          <tr data-id="${r.id}" style="cursor:pointer" onclick="showDetail(${JSON.stringify(r).replace(/"/g, '&quot;')})">
            <td class="date-cell">${formatDate(r.created_at)}</td>
            <td>${escapeHtml(r.full_name)}</td>
            <td><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></td>
            <td><a href="tel:${escapeHtml(r.phone)}">${escapeHtml(r.phone)}</a></td>
            <td>${escapeHtml(r.city)}</td>
            <td class="message-preview">${escapeHtml(r.message)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  requestsContent.innerHTML = table;
}

function showDetail(request) {
  modalBody.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">Data zgłoszenia</div>
      <div class="detail-value">${formatDate(request.created_at)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Imię i nazwisko</div>
      <div class="detail-value">${escapeHtml(request.full_name)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">E-mail</div>
      <div class="detail-value"><a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email)}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Telefon</div>
      <div class="detail-value"><a href="tel:${escapeHtml(request.phone)}">${escapeHtml(request.phone)}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Miejscowość</div>
      <div class="detail-value">${escapeHtml(request.city)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Wiadomość</div>
      <div class="detail-value message">${escapeHtml(request.message)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Adres IP</div>
      <div class="detail-value">${escapeHtml(request.ip_address || '-')}</div>
    </div>
  `;
  detailModal.classList.add('show');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
