<?php

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Mailer.php';
require_once __DIR__ . '/../helpers/Auth.php';

function handleSendCode(): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('A valid email is required');
    }

    $db = getDB();

    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $stmt = $db->prepare('INSERT INTO magic_links (email, code, expires_at) VALUES (?, ?, datetime("now", "+10 minutes"))');
    $stmt->execute([$email, $code]);

    $sent = sendMagicCode($email, $code);

    jsonResponse([
        'message' => 'Code sent to your email',
        'debug_code' => $sent ? null : $code,
    ]);
}

function handleVerifyCode(): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');
    $code = trim($input['code'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
        errorResponse('Invalid email or code format');
    }

    $db = getDB();

    $stmt = $db->prepare(
        'SELECT id FROM magic_links
         WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime("now")
         ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([$email, $code]);
    $link = $stmt->fetch();

    if (!$link) {
        errorResponse('Invalid or expired code', 401);
    }

    $stmt = $db->prepare('UPDATE magic_links SET used = 1 WHERE id = ?');
    $stmt->execute([$link['id']]);

    $stmt = $db->prepare('SELECT id, email, name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $stmt = $db->prepare('INSERT INTO users (email, name) VALUES (?, ?)');
        $name = explode('@', $email)[0];
        $stmt->execute([$email, $name]);
        $userId = $db->lastInsertId();
        $user = ['id' => $userId, 'email' => $email, 'name' => $name];
    }

    $token = generateToken(['user_id' => (int) $user['id']]);

    jsonResponse([
        'token' => $token,
        'user' => $user,
    ]);
}
