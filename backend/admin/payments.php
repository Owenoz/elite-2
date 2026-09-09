<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Payments — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>
<div class="main">
    <div class="page-header">
        <div><h2>Payments</h2><p class="sub">All payment transactions</p></div>
        <div class="filter-tabs">
            <button class="tab active" onclick="filterPayments('',this)">All</button>
            <button class="tab" onclick="filterPayments('completed',this)">Completed</button>
            <button class="tab" onclick="filterPayments('pending',this)">Pending</button>
        </div>
    </div>

    <div class="card">
        <div class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Email</th>
                        <th>Movie</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody id="paymentsBody">
                    <tr><td colspan="6" class="loading-row">Loading payments...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" id="paymentsPagination"></div>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
let currentPage = 1;
let currentStatus = '';

loadPayments();

function filterPayments(status, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    currentStatus = status;
    currentPage = 1;
    loadPayments();
}

function loadPayments(page) {
    if (page) currentPage = page;
    adminApi('list_payments', { page: currentPage, status: currentStatus })
        .then(data => {
            const tbody = document.getElementById('paymentsBody');
            if (!data.payments.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No payments found</td></tr>';
                return;
            }
            tbody.innerHTML = data.payments.map(p => `
                <tr>
                    <td><code class="ref">${esc(p.reference)}</code></td>
                    <td>${esc(p.email)}</td>
                    <td>${esc(p.movie_title || '—')}</td>
                    <td><strong>${Number(p.amount).toLocaleString()} ${p.currency}</strong></td>
                    <td><span class="badge ${p.status === 'completed' ? 'badge-green' : p.status === 'pending' ? 'badge-warn' : 'badge-red'}">
                        ${p.status}
                    </span></td>
                    <td class="muted small">${new Date(p.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
            renderPagination('paymentsPagination', currentPage, Math.ceil(data.total / 20), loadPayments);
        });
}
</script>
</body>
</html>
