<?php

require_once __DIR__ . '/../src/config.php';
require_once __DIR__ . '/../src/database.php';
require_once __DIR__ . '/../src/helpers/Response.php';

header('Access-Control-Allow-Origin: ' . APP_URL);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

runMigrations();

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

require_once __DIR__ . '/../src/controllers/AuthController.php';
require_once __DIR__ . '/../src/controllers/UserController.php';
require_once __DIR__ . '/../src/controllers/TaskController.php';
require_once __DIR__ . '/../src/controllers/SubscriptionController.php';

// Routes
if ($uri === '/api/auth/send-code' && $method === 'POST') {
    handleSendCode();
} elseif ($uri === '/api/auth/verify-code' && $method === 'POST') {
    handleVerifyCode();
} elseif ($uri === '/api/user/profile' && $method === 'GET') {
    handleGetProfile();
} elseif ($uri === '/api/user/profile' && $method === 'PUT') {
    handleUpdateProfile();
} elseif ($uri === '/api/tasks' && $method === 'GET') {
    handleGetTasks();
} elseif ($uri === '/api/payments/initialize' && $method === 'POST') {
    handleInitializePayment();
} elseif ($uri === '/api/payments/verify' && $method === 'POST') {
    handleVerifyPayment();
} elseif ($uri === '/api/subscription/current' && $method === 'GET') {
    handleCurrentSubscription();
} elseif ($uri === '/api/webhooks/paystack' && $method === 'POST') {
    handlePaystackWebhook();
} else {
    errorResponse('Not Found', 404);
}
