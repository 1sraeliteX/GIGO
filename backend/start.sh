#!/bin/bash
echo "Starting PHP dev server on http://localhost:8000"
echo "API available at http://localhost:8000/api"
php -d openssl.cafile=/usr/local/etc/ca-certificates/cert.pem -S localhost:8000 -t public
