<?php
// ═══════════════════════════════════════════════════════════════════
// ELITE MOVIES API — Configuration
// Fill in YOUR cPanel credentials below before uploading this file.
// ═══════════════════════════════════════════════════════════════════

// ── Database (get these from cPanel → MySQL Databases) ──────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'ochira_elite_movies');
define('DB_USER', 'ochira_maki');
define('DB_PASS', 'Owenoz123.');

// ── Your domain ─────────────────────────────────────────────────────
define('APP_DOMAIN', 'https://hostherb.com');
define('APP_NAME',   'Elite Movies');

// ── Security (change this to any random string) ─────────────────────
define('SECRET_KEY', 'change_this_to_something_random_and_long_2024');

// ── OTP expiry in minutes ────────────────────────────────────────────
define('OTP_EXPIRY_MINUTES', 15);

// ── Email sender (cPanel supports PHP mail() by default) ─────────────
define('MAIL_FROM',      'noreply@hostherb.com');
define('MAIL_FROM_NAME', 'Elite Movies');
