/* ─── Elite Movies Admin — Shared JS ───────────────────────────────────────── */

// ── Core API wrapper ──────────────────────────────────────────────────────────
async function adminApi(action, body = {}) {
    const res = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API error');
    return json.data;
}

// ── HTML escaping ─────────────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Debounce ──────────────────────────────────────────────────────────────────
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Pagination renderer ───────────────────────────────────────────────────────
function renderPagination(containerId, current, totalPages, callback) {
    const el = document.getElementById(containerId);
    if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
    let html = '';
    if (current > 1) html += `<button class="page-btn" onclick="${callback.name}(${current - 1})">‹</button>`;
    const start = Math.max(1, current - 2);
    const end   = Math.min(totalPages, current + 2);
    if (start > 1) html += `<button class="page-btn" onclick="${callback.name}(1)">1</button>${start > 2 ? '<span class="muted" style="padding:0 4px">…</span>' : ''}`;
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${callback.name}(${i})">${i}</button>`;
    }
    if (end < totalPages) html += `${end < totalPages - 1 ? '<span class="muted" style="padding:0 4px">…</span>' : ''}<button class="page-btn" onclick="${callback.name}(${totalPages})">${totalPages}</button>`;
    if (current < totalPages) html += `<button class="page-btn" onclick="${callback.name}(${current + 1})">›</button>`;
    el.innerHTML = html;
}

// ── Modal helper ──────────────────────────────────────────────────────────────
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ── Load dashboard stats ──────────────────────────────────────────────────────
function loadStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    adminApi('stats').then(d => {
        const cards = grid.querySelectorAll('.stat-card');
        const vals = [
            d.movies_available,
            Number(d.revenue_ugx).toLocaleString(),
            Number(d.today_revenue).toLocaleString(),
            d.payments,
            d.downloads,
            d.pending_payments,
        ];
        cards.forEach((card, i) => {
            card.querySelector('.stat-val').textContent = vals[i] ?? '—';
            card.classList.remove('loading');
        });

        // Recent payments
        const rp = document.getElementById('recentPayments');
        if (rp) {
            if (!d.recent_payments || !d.recent_payments.length) {
                rp.innerHTML = '<div class="empty-row">No payments yet</div>';
                return;
            }
            rp.innerHTML = `<table class="recent-table">
                <tr style="color:var(--muted);font-size:11px;text-transform:uppercase">
                    <td>Email</td><td>Movie</td><td>Amount</td><td>Date</td>
                </tr>
                ${d.recent_payments.map(p => `<tr>
                    <td>${esc(p.email)}</td>
                    <td>${esc(p.movie_title || '—')}</td>
                    <td><strong style="color:var(--gold)">${Number(p.amount).toLocaleString()} UGX</strong></td>
                    <td style="color:var(--muted);font-size:11px">${new Date(p.created_at).toLocaleDateString()}</td>
                </tr>`).join('')}
            </table>`;
        }
    }).catch(err => {
        console.error('Stats error:', err);
    });
}
