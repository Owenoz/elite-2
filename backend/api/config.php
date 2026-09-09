<?php
// ═══════════════════════════════════════════════════════════════════
// ELITE MOVIES API — Configuration
// Fill in YOUR cPanel credentials below before uploading this file.
// ═══════════════════════════════════════════════════════════════════

// ── Database (get these from cPanel → MySQL Databases) ──────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'YOUR_CPANEL_USERNAME_elite_movies');  // e.g. owenoz_elite_movies
define('DB_USER', 'YOUR_CPANEL_USERNAME_elite_user');    // e.g. owenoz_elite_user
define('DB_PASS', 'YOUR_DATABASE_PASSWORD');             // password you set for the DB user

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
