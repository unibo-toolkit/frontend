#!/usr/bin/env bash
# One-time local dev setup: generate a dev JWT keypair and scaffold env files.
# Safe to re-run — it never overwrites Google creds you've already filled in.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ Generating dev JWT RSA keypair (dev/keys/) …"
mkdir -p dev/keys
if [ ! -f dev/keys/jwt.key ]; then
  openssl genrsa -out dev/keys/jwt.key 2048 2>/dev/null
  openssl rsa -in dev/keys/jwt.key -pubout -out dev/keys/jwt.pub 2>/dev/null
  echo "  created dev/keys/jwt.key + jwt.pub"
else
  echo "  reusing existing dev/keys/jwt.key"
fi

# Join PEM lines into a single \n-escaped string (what auth-service expects).
esc() { awk 'NF{ printf "%s\\n", $0 }' "$1"; }
PRIV="$(esc dev/keys/jwt.key)"
PUB="$(esc dev/keys/jwt.pub)"

echo "▸ Scaffolding dev/auth.env …"
[ -f dev/auth.env ] || cp dev/auth.env.example dev/auth.env
# Inject the keys (ENVIRON avoids awk backslash-escape processing), keep everything else.
PRIV="$PRIV" PUB="$PUB" awk '
  /^JWT_PRIVATE_KEY=/ { print "JWT_PRIVATE_KEY=\"" ENVIRON["PRIV"] "\""; next }
  /^JWT_PUBLIC_KEY=/  { print "JWT_PUBLIC_KEY=\"" ENVIRON["PUB"] "\""; next }
  { print }
' dev/auth.env > dev/auth.env.tmp && mv dev/auth.env.tmp dev/auth.env

echo "▸ Scaffolding .env.development.local …"
if [ -f .env.development.local ]; then
  echo "  .env.development.local already exists — left untouched"
else
  cp dev/frontend.env.example .env.development.local
  echo "  created .env.development.local"
fi

echo ""
echo "Setup done. Next steps:"
echo "  1. Create a LOCAL Google OAuth dev app (see dev/README.md) and put"
echo "     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET into dev/auth.env"
echo "  2. Run:  make dev"
