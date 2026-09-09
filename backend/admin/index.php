<?php
require_once __DIR__ . '/auth.php';

// Already logged in → go to dashboard
if (!empty($_SESSION[ADMIN_SESSION_KEY])) {
    header('Location: dashboard.php');
    exit();
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (adminLogin($_POST['password'] ?? '')) {
        header('Location: dashboard.php');
        exit();
    } else {
        $error = 'Incorrect password. Try again.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Elite Movies — Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body class="login-page">
<div class="login-box">
    <div class="login-logo">
        <span class="crown">👑</span>
        <h1>ELITE MOVIES</h1>
        <p>Admin Panel</p>
    </div>
    <?php if ($error): ?>
    <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="POST" class="login-form">
        <div class="field">
            <label>Admin Password</label>
            <input type="password" name="password" placeholder="Enter admin password" autofocus required>
        </div>
        <button type="submit" class="btn btn-gold btn-full">Sign In →</button>
    </form>
    <p class="login-note">Elite Movies Management System</p>
</div>
</body>
</html>
