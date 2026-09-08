<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// POST /api/payments.php?action=create   → create pending payment + send OTP
// POST /api/payments.php?action=verify   → verify OTP → complete payment
// GET  /api/payments.php?email=x&movie=y → check if email has paid for movie

// ─────────────────────────────────────────────────────────────────────────────

if ($method === 'GET') {
    $email    = strtolower(sanitize($_GET['email'] ?? ''));
    $movie_id = (int) ($_GET['movie_id'] ?? 0);

    if (!$email || !$movie_id) {
        respond(false, null, 'email and movie_id are required', 422);
    }

    $stmt = $db->prepare("SELECT id FROM downloads WHERE email = ? AND movie_id = ? LIMIT 1");
    $stmt->execute([$email, $movie_id]);
    $has_access = (bool) $stmt->fetch();

    respond(true, ['has_access' => $has_access]);
}

// ─────────────────────────────────────────────────────────────────────────────

if ($method === 'POST') {
    $action = sanitize($_GET['action'] ?? '');
    $body   = getBody();

    // ── ACTION: create ────────────────────────────────────────────────────────
    // Creates a pending payment record and sends OTP to the user's email.
    if ($action === 'create') {
        $email       = strtolower(sanitize($body['email'] ?? ''));
        $movie_id    = (int) ($body['movie_id'] ?? 0);
        $movie_title = sanitize($body['movie_title'] ?? '');

        if (!$email || !$movie_id) {
            respond(false, null, 'email and movie_id are required', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(false, null, 'Invalid email address', 422);
        }

        // Check if already paid — no need to go through payment again
        $stmt = $db->prepare("SELECT id FROM downloads WHERE email = ? AND movie_id = ? LIMIT 1");
        $stmt->execute([$email, $movie_id]);
        if ($stmt->fetch()) {
            respond(true, ['already_paid' => true, 'message' => 'You already have access to this movie']);
        }

        // Generate payment reference
        $reference = generateReference();

        // Insert pending payment
        $stmt = $db->prepare("
            INSERT INTO payments (email, movie_id, movie_title, amount, currency, status, reference)
            VALUES (?, ?, ?, 5000, 'UGX', 'pending', ?)
        ");
        $stmt->execute([$email, $movie_id, $movie_title, $reference]);

        // Generate OTP and store it
        $otp     = generateOtp();
        $expires = date('Y-m-d H:i:s', time() + (OTP_EXPIRY_MINUTES * 60));

        // Remove any existing unused OTPs for this email+purpose
        $db->prepare("DELETE FROM otp_codes WHERE email = ? AND purpose = 'payment' AND used = 0")
           ->execute([$email]);

        $stmt = $db->prepare("
            INSERT INTO otp_codes (email, code, purpose, used, expires_at)
            VALUES (?, ?, 'payment', 0, ?)
        ");
        $stmt->execute([$email, $otp, $expires]);

        // Send OTP email
        $sent = sendOtpEmail($email, $otp, $movie_title, $reference);

        respond(true, [
            'reference'  => $reference,
            'email_sent' => $sent,
            'message'    => $sent
                ? "A 6-digit code has been sent to $email"
                : "Code generated (email may be in spam): $otp", // fallback for testing
        ]);
    }

    // ── ACTION: verify ────────────────────────────────────────────────────────
    // Verifies OTP → marks payment complete → records download access.
    if ($action === 'verify') {
        $email     = strtolower(sanitize($body['email'] ?? ''));
        $otp       = sanitize($body['otp'] ?? '');
        $reference = sanitize($body['reference'] ?? '');

        if (!$email || !$otp || !$reference) {
            respond(false, null, 'email, otp and reference are required', 422);
        }

        // Find the OTP record
        $stmt = $db->prepare("
            SELECT * FROM otp_codes
            WHERE email = ? AND code = ? AND purpose = 'payment'
              AND used = 0 AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$email, $otp]);
        $otpRecord = $stmt->fetch();

        if (!$otpRecord) {
            respond(false, null, 'Invalid or expired code. Please try again.', 400);
        }

        // Find the pending payment
        $stmt = $db->prepare("SELECT * FROM payments WHERE reference = ? AND email = ? AND status = 'pending'");
        $stmt->execute([$reference, $email]);
        $payment = $stmt->fetch();

        if (!$payment) {
            respond(false, null, 'Payment record not found', 404);
        }

        // Mark OTP as used
        $db->prepare("UPDATE otp_codes SET used = 1 WHERE id = ?")->execute([$otpRecord['id']]);

        // Mark payment as completed
        $db->prepare("UPDATE payments SET status = 'completed' WHERE id = ?")->execute([$payment['id']]);

        // Get archive info for this movie
        $stmt = $db->prepare("SELECT archive_identifier, archive_url FROM movies WHERE tmdb_id = ?");
        $stmt->execute([$payment['movie_id']]);
        $movieData = $stmt->fetch();
        $archiveUrl = $movieData['archive_url'] ?? '';

        // Record download access (INSERT IGNORE so re-verification is safe)
        $stmt = $db->prepare("
            INSERT IGNORE INTO downloads (email, movie_id, movie_title, archive_url)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$email, $payment['movie_id'], $payment['movie_title'], $archiveUrl]);

        // Send confirmation email
        sendConfirmationEmail($email, $payment['movie_title'], $reference);

        respond(true, [
            'verified'             => true,
            'movie_id'             => (int) $payment['movie_id'],
            'movie_title'          => $payment['movie_title'],
            'archive_url'          => $archiveUrl,
            'archive_identifier'   => $movieData['archive_identifier'] ?? null,
            'message'              => 'Payment verified! You now have access to this movie.',
        ]);
    }

    // ── ACTION: resend ────────────────────────────────────────────────────────
    if ($action === 'resend') {
        $email     = strtolower(sanitize($body['email'] ?? ''));
        $reference = sanitize($body['reference'] ?? '');

        if (!$email || !$reference) {
            respond(false, null, 'email and reference are required', 422);
        }

        $stmt = $db->prepare("SELECT * FROM payments WHERE reference = ? AND email = ?");
        $stmt->execute([$reference, $email]);
        $payment = $stmt->fetch();
        if (!$payment) respond(false, null, 'Payment not found', 404);

        // Invalidate old OTPs
        $db->prepare("DELETE FROM otp_codes WHERE email = ? AND purpose = 'payment' AND used = 0")
           ->execute([$email]);

        $otp     = generateOtp();
        $expires = date('Y-m-d H:i:s', time() + (OTP_EXPIRY_MINUTES * 60));
        $db->prepare("INSERT INTO otp_codes (email, code, purpose, used, expires_at) VALUES (?, ?, 'payment', 0, ?)")
           ->execute([$email, $otp, $expires]);

        $sent = sendOtpEmail($email, $otp, $payment['movie_title'], $reference);

        respond(true, [
            'email_sent' => $sent,
            'message'    => $sent ? "New code sent to $email" : "Code: $otp (email failed)",
        ]);
    }

    respond(false, null, 'Unknown action', 400);
}

respond(false, null, 'Method not allowed', 405);

// ─── Email helpers ────────────────────────────────────────────────────────────

function sendOtpEmail(string $email, string $otp, string $movieTitle, string $reference): bool {
    $subject = APP_NAME . ' — Your verification code';
    $body = "
<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#09090F;font-family:Arial,sans-serif;'>
  <div style='max-width:480px;margin:40px auto;background:#1C1B2E;border-radius:16px;overflow:hidden;border:1px solid #2a2840;'>
    <div style='background:#D4AF37;padding:24px;text-align:center;'>
      <h1 style='margin:0;color:#000;font-size:22px;letter-spacing:2px;font-weight:900;'>🎬 ELITE MOVIES</h1>
    </div>
    <div style='padding:32px;'>
      <h2 style='color:#fff;font-size:20px;margin-top:0;'>Your Verification Code</h2>
      <p style='color:#A8B5DB;font-size:14px;line-height:22px;'>
        You requested to download <strong style='color:#D4AF37;'>$movieTitle</strong>.<br>
        Enter this code to confirm your payment of <strong style='color:#D4AF37;'>5,000 UGX</strong>:
      </p>
      <div style='background:#09090F;border:2px solid #D4AF37;border-radius:12px;padding:20px;text-align:center;margin:24px 0;'>
        <span style='color:#D4AF37;font-size:40px;font-weight:900;letter-spacing:12px;'>$otp</span>
      </div>
      <p style='color:#666;font-size:12px;'>
        This code expires in " . OTP_EXPIRY_MINUTES . " minutes.<br>
        Reference: <code style='color:#A8B5DB;'>$reference</code>
      </p>
      <p style='color:#444;font-size:11px;border-top:1px solid #2a2840;padding-top:16px;margin-bottom:0;'>
        If you did not request this, ignore this email.<br>
        &copy; " . date('Y') . " " . APP_NAME . "
      </p>
    </div>
  </div>
</body>
</html>
";
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
    $headers .= "Reply-To: " . MAIL_FROM . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    return mail($email, $subject, $body, $headers);
}

function sendConfirmationEmail(string $email, string $movieTitle, string $reference): void {
    $subject = APP_NAME . ' — Payment Confirmed ✅';
    $body = "
<!DOCTYPE html>
<html>
<body style='margin:0;padding:0;background:#09090F;font-family:Arial,sans-serif;'>
  <div style='max-width:480px;margin:40px auto;background:#1C1B2E;border-radius:16px;overflow:hidden;border:1px solid #2a2840;'>
    <div style='background:#D4AF37;padding:24px;text-align:center;'>
      <h1 style='margin:0;color:#000;font-size:22px;letter-spacing:2px;'>🎬 ELITE MOVIES</h1>
    </div>
    <div style='padding:32px;'>
      <div style='text-align:center;font-size:48px;margin-bottom:16px;'>✅</div>
      <h2 style='color:#fff;text-align:center;'>Payment Confirmed!</h2>
      <p style='color:#A8B5DB;font-size:14px;line-height:22px;text-align:center;'>
        You now have full access to<br>
        <strong style='color:#D4AF37;font-size:18px;'>$movieTitle</strong>
      </p>
      <div style='background:#09090F;border-radius:10px;padding:16px;margin:20px 0;'>
        <p style='color:#666;font-size:12px;margin:0;'>Amount: <span style='color:#D4AF37;'>5,000 UGX</span></p>
        <p style='color:#666;font-size:12px;margin:4px 0 0;'>Reference: <code style='color:#A8B5DB;'>$reference</code></p>
      </div>
      <p style='color:#444;font-size:11px;border-top:1px solid #2a2840;padding-top:16px;'>
        Open the Elite Movies app to watch your movie.<br>
        &copy; " . date('Y') . " " . APP_NAME . "
      </p>
    </div>
  </div>
</body>
</html>
";
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
    mail($email, $subject, $body, $headers);
}
