<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendMagicCode(string $email, string $code): bool
{
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->Port = SMTP_PORT;

        if (SMTP_PORT === 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } elseif (in_array(SMTP_PORT, [587, 2525, 25])) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($email);
        $mail->Subject = 'Your Magic Login Code';
        $mail->isHTML(true);
        $mail->Body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #56c5ba 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        h2 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        p {
            font-size: 14px;
            line-height: 1.8;
            color: #555;
            margin-bottom: 12px;
        }
        .code-box {
            background-color: #f0f0f5;
            padding: 30px;
            border-radius: 6px;
            margin: 25px 0;
            text-align: center;
        }
        .code {
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #4f46e5;
            text-align: center;
            font-family: 'Courier New', monospace;
        }
        .expiry {
            font-size: 13px;
            color: #999;
            text-align: center;
            margin-top: 12px;
        }
        .warning-text {
            font-size: 13px;
            color: #666;
            margin-top: 20px;
            padding: 15px;
            background-color: #fafafa;
            border-left: 3px solid #fbbf24;
            border-radius: 4px;
        }
        .ignore-text {
            font-size: 13px;
            color: #666;
            margin: 15px 0;
            font-style: italic;
        }
        .no-reply-text {
            font-size: 12px;
            color: #999;
            margin: 20px 0;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .footer-tagline {
            font-size: 14px;
            color: #555;
            margin-bottom: 20px;
        }
        .footer-tagline.highlight {
            font-weight: 600;
            color: #1a1a1a;
        }
        .brand {
            font-size: 12px;
            color: #666;
            margin-top: 15px;
        }
        .brand-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        .brand-logo {
            font-size: 11px;
            color: #999;
            margin-top: 15px;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 30px 20px;
            }
            .code {
                font-size: 36px;
                letter-spacing: 6px;
            }
            h2 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            GIGO
        </div>
        <div class="content">
            <div class="section">
                <h2>Verification Code</h2>
                <p>Use the code below to verify your email and log in to your account. This code will expire in 10 minutes.</p>
            </div>
            <div class="code-box">
                <div class="code">{$code}</div>
                <div class="expiry">Expires in 10 minutes</div>
            </div>
            <div class="warning-text">
                <strong>For security reasons,</strong> keep this code safe and do not share it with anyone.
            </div>
            <div class="ignore-text">
                If you didn't request this code, simply ignore this message.
            </div>
            <div class="no-reply-text">
                Please don't reply to this email. It was sent from a no-reply address and responses won't be received.
            </div>
            <div class="section">
                <p class="footer-tagline">Here's to simpler, safer verifications.<br><span class="highlight">GIGO Team</span></p>
            </div>
        </div>
        <div class="footer">
            <div class="brand-logo">GIGO</div>
        </div>
    </div>
</body>
</html>
HTML;

        $mail->send();
        return true;
    } catch (Exception) {
        return false;
    }
}
