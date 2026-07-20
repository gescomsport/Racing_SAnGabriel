#!/bin/bash
# Despliega el frontend de un club al VPS.
# Uso: ./deploy-club.sh racing-sangabriel
# El club_id en MongoDB determina qué datos se muestran — el build es el mismo para todos.

set -e

CLUB="${1:-racing-sangabriel}"
VPS_HOST="185.68.110.213"
VPS_PORT="50050"
VPS_USER="root"

# Ruta en el VPS donde Apache sirve los ficheros del subdominio.
# Ajustar si cPanel usa una ruta diferente (ver output de: grep -r $CLUB /etc/apache2/conf/)
VPS_WEBROOT="/home/sudeporte/public_html/${CLUB}"

echo "=== Construyendo frontend ==="
cd "$(dirname "$0")/frontend"
npm install --legacy-peer-deps
npm install ajv@8.17.1 --legacy-peer-deps
npm run build
cd ..

echo "=== Desplegando ${CLUB} en VPS ==="
ssh -p "${VPS_PORT}" "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_WEBROOT}"
scp -P "${VPS_PORT}" -r frontend/build/* "${VPS_USER}@${VPS_HOST}:${VPS_WEBROOT}/"

echo "=== Listo: https://${CLUB}.sudeporte.com ==="
