<?php
require_once __DIR__ . '/../api/config.php';

// Session lifetime — 8 hours
define('ADMIN_SESSION_LIFETIME', 8 * 60 * 60);
define('ADMIN_SESSION_KEY', 'elite_admin_logged_in');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => ADMIN_SESSION_LIFETIME,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function requireAdminAuth(): void {
    if (empty($_SESSION[ADMIN_SESSION_KEY])) {
        header('Location: index.php');
        exit();
    }
    // Auto-expire after 8 hours of inactivity
    if (!empty($_SESSION['admin_login_time']) && time() - $_SESSION['admin_login_time'] > ADMIN_SESSION_LIFETIME) {
        adminLogout();
    }
    // Refresh activity time
    $_SESSION['admin_login_time'] = time();
}

function adminLogin(string $password): bool {
    if ($password === ADMIN_PASSWORD) {
        session_regenerate_id(true);
        $_SESSION[ADMIN_SESSION_KEY] = true;
        $_SESSION['admin_login_time'] = time();
        return true;
    }
    return false;
}

function adminLogout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    header('Location: index.php');
    exit();
}
