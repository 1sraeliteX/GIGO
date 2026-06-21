<?php

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

function handleInitializePayment(): void
{
    $user = requireAuth();

    $input = json_decode(file_get_contents('php://input'), true);
    $plan = $input['plan'] ?? '';

    if (!in_array($plan, ['1_week', '1_month'])) {
        errorResponse('Invalid plan. Choose 1_week or 1_month.');
    }

    $amount = $plan === '1_week' ? SUBSCRIPTION_1_WEEK_PRICE : SUBSCRIPTION_1_MONTH_PRICE;

    $response = paystackPost('/transaction/initialize', [
        'email' => $user['email'],
        'amount' => (string) $amount,
        'metadata' => [
            'user_id' => $user['id'],
            'plan' => $plan,
        ],
        'callback_url' => APP_URL . '/dashboard',
    ]);

    if (!$response || !($response['status'] ?? false)) {
        errorResponse('Failed to initialize payment. Please try again.', 500);
    }

    $data = $response['data'];

    $db = getDB();
    $stmt = $db->prepare(
        'INSERT INTO payments (user_id, reference, amount, plan, status, paystack_data)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $user['id'],
        $data['reference'],
        $amount,
        $plan,
        'pending',
        json_encode($data),
    ]);

    jsonResponse([
        'authorization_url' => $data['authorization_url'],
        'reference' => $data['reference'],
    ]);
}

function handleCurrentSubscription(): void
{
    $user = requireAuth();

    $db = getDB();

    $stmt = $db->prepare(
        "UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE status = 'active' AND expires_at < ?"
    );
    $stmt->execute([date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]);

    $stmt = $db->prepare(
        'SELECT plan, status, starts_at, expires_at
         FROM subscriptions
         WHERE user_id = ? AND status = ?
         ORDER BY id DESC
         LIMIT 1'
    );
    $stmt->execute([$user['id'], 'active']);
    $sub = $stmt->fetch();

    if (!$sub) {
        jsonResponse(['subscription' => null]);
        return;
    }

    $expiresAt = strtotime($sub['expires_at']);
    $now = time();
    $remainingSeconds = max(0, $expiresAt - $now);

    jsonResponse([
        'subscription' => [
            'plan' => $sub['plan'],
            'status' => $sub['status'],
            'starts_at' => $sub['starts_at'],
            'expires_at' => $sub['expires_at'],
            'remaining_seconds' => $remainingSeconds,
            'remaining_days' => floor($remainingSeconds / 86400),
            'remaining_hours' => floor(($remainingSeconds % 86400) / 3600),
        ],
    ]);
}

function handlePaystackWebhook(): void
{
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';

    if (empty(PAYSTACK_SECRET_KEY)) {
        errorResponse('Paystack not configured', 500);
    }

    $expected = hash_hmac('sha512', $payload, PAYSTACK_SECRET_KEY);
    if (!hash_equals($expected, $signature)) {
        http_response_code(400);
        echo 'Invalid signature';
        exit;
    }

    $event = json_decode($payload, true);
    if (!$event || !isset($event['event'])) {
        http_response_code(400);
        echo 'Invalid event';
        exit;
    }

    if ($event['event'] === 'charge.success') {
        handleChargeSuccess($event['data']);
    }

    http_response_code(200);
    echo 'OK';
    exit;
}

function handleChargeSuccess(array $data): void
{
    $reference = $data['reference'] ?? '';

    if (($data['status'] ?? '') !== 'success') {
        return;
    }

    $db = getDB();

    $stmt = $db->prepare('SELECT id, status FROM payments WHERE reference = ?');
    $stmt->execute([$reference]);
    $payment = $stmt->fetch();

    if ($payment && $payment['status'] === 'success') {
        return;
    }

    $metadata = $data['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? null;
    $plan = $metadata['plan'] ?? null;

    if (!$userId || !$plan) {
        return;
    }

    $amount = $data['amount'] ?? 0;

    if (!$payment) {
        $stmt = $db->prepare(
            'INSERT INTO payments (user_id, reference, amount, plan, status, paystack_data)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $reference, $amount, $plan, 'success', json_encode($data)]);
    } else {
        $stmt = $db->prepare('UPDATE payments SET status = ?, paystack_data = ? WHERE reference = ?');
        $stmt->execute(['success', json_encode($data), $reference]);
    }

    if ($plan === '1_week') {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    } else {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 month'));
    }

    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare(
        "UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'"
    );
    $stmt->execute([$userId]);

    $stmt = $db->prepare(
        'INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $plan, 'active', $now, $expiresAt, $now, $now]);
}

function handleVerifyPayment(): void
{
    $user = requireAuth();

    $input = json_decode(file_get_contents('php://input'), true);
    $reference = $input['reference'] ?? '';

    if (!$reference) {
        errorResponse('Reference is required');
    }

    $db = getDB();

    $stmt = $db->prepare(
        'SELECT plan, status, starts_at, expires_at
         FROM subscriptions
         WHERE user_id = ? AND status = ?
         ORDER BY id DESC
         LIMIT 1'
    );
    $stmt->execute([$user['id'], 'active']);
    $existing = $stmt->fetch();

    if ($existing) {
        $remainingSeconds = max(0, strtotime($existing['expires_at']) - time());
        jsonResponse([
            'subscription' => [
                'plan' => $existing['plan'],
                'status' => $existing['status'],
                'starts_at' => $existing['starts_at'],
                'expires_at' => $existing['expires_at'],
                'remaining_seconds' => $remainingSeconds,
                'remaining_days' => floor($remainingSeconds / 86400),
                'remaining_hours' => floor(($remainingSeconds % 86400) / 3600),
            ],
        ]);
        return;
    }

    $response = paystackGet('/transaction/verify/' . $reference);

    if (!$response || !($response['status'] ?? false)) {
        jsonResponse(['subscription' => null]);
        return;
    }

    $data = $response['data'];

    if (($data['status'] ?? '') !== 'success') {
        jsonResponse(['subscription' => null]);
        return;
    }

    $stmt = $db->prepare('SELECT id, status FROM payments WHERE reference = ?');
    $stmt->execute([$reference]);
    $payment = $stmt->fetch();

    $metadata = $data['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? $user['id'];
    $plan = $metadata['plan'] ?? $payment['plan'] ?? null;

    if (!$plan) {
        jsonResponse(['subscription' => null]);
        return;
    }

    $amount = $data['amount'] ?? 0;

    if (!$payment) {
        $stmt = $db->prepare(
            'INSERT INTO payments (user_id, reference, amount, plan, status, paystack_data)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $reference, $amount, $plan, 'success', json_encode($data)]);
    } elseif ($payment['status'] !== 'success') {
        $stmt = $db->prepare('UPDATE payments SET status = ?, paystack_data = ? WHERE reference = ?');
        $stmt->execute(['success', json_encode($data), $reference]);
    }

    $stmt = $db->prepare(
        "UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'"
    );
    $stmt->execute([$userId]);

    $expiresAt = $plan === '1_week'
        ? date('Y-m-d H:i:s', strtotime('+7 days'))
        : date('Y-m-d H:i:s', strtotime('+1 month'));

    $now = date('Y-m-d H:i:s');

    $stmt = $db->prepare(
        'INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $plan, 'active', $now, $expiresAt, $now, $now]);

    $stmt = $db->prepare(
        'SELECT plan, status, starts_at, expires_at
         FROM subscriptions
         WHERE user_id = ? AND status = ?
         ORDER BY id DESC
         LIMIT 1'
    );
    $stmt->execute([$userId, 'active']);
    $sub = $stmt->fetch();

    if ($sub) {
        $remainingSeconds = max(0, strtotime($sub['expires_at']) - time());
        jsonResponse([
            'subscription' => [
                'plan' => $sub['plan'],
                'status' => $sub['status'],
                'starts_at' => $sub['starts_at'],
                'expires_at' => $sub['expires_at'],
                'remaining_seconds' => $remainingSeconds,
                'remaining_days' => floor($remainingSeconds / 86400),
                'remaining_hours' => floor(($remainingSeconds % 86400) / 3600),
            ],
        ]);
    } else {
        jsonResponse(['subscription' => null]);
    }
}

function paystackPost(string $path, array $data): ?array
{
    $ch = curl_init('https://api.paystack.co' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_CAINFO => '/etc/ssl/cert.pem',
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . PAYSTACK_SECRET_KEY,
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    return json_decode($response, true);
}

function paystackGet(string $path): ?array
{
    $ch = curl_init('https://api.paystack.co' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CAINFO => '/etc/ssl/cert.pem',
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . PAYSTACK_SECRET_KEY,
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    return json_decode($response, true);
}
