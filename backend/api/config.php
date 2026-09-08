<?php
// ─── Elite Movies API Configuration ─────────────────────────────────────────
// Replace these values with your actual cPanel database credentials

define('DB_HOST', 'localhost');
define('DB_NAME', 'YOUR_CPANEL_USERNAME_elite_movies'); // e.g. owenoz_elite_movies
define('DB_USER', 'YOUR_CPANEL_USERNAME_elite_user');   // e.g. owenoz_elite_user
define('DB_PASS', 'YOUR_DATABASE_PASSWORD');

// Your domain — used for CORS and email links
define('APP_DOMAIN', 'https://hostherb.com');
define('APP_NAME', 'Elite Movies');

// Secret key for signing OTPs (change this to something random)
define('SECRET_KEY', 'elite_movies_secret_key_change_this_2024');

// OTP expiry in minutes
define('OTP_EXPIRY_MINUTES', 15);

// ─── Email config (cPanel usually supports PHP mail() by default) ─────────────
define('MAIL_FROM', 'noreply@hostherb.com');
define('MAIL_FROM_NAME', 'Elite Movies');
