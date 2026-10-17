#!/usr/bin/env bash
# Corre NO SERVIDOR, chamado pelo workflow .github/workflows/deploy.yml via
# SSH (ou à mão, para um deploy manual). Não faz "git clone" nenhum — o
# código já está empacotado nas imagens Docker publicadas em ghcr.io; este
# script só actualiza a tag da imagem usada e reinicia o serviço.
#
# Uso:
#   ./deploy.sh <staging|production> <tag-da-imagem>
#
# Espera a seguinte estrutura, já criada manualmente uma vez por ambiente
# (ver docs/DEPLOYMENT.md):
#   /srv/plagea/<ambiente>/docker-compose.yml   <- sincronizado pelo CD a cada deploy
#   /srv/plagea/<ambiente>/.env                 <- segredos + APP_IMAGE/MIGRATE_IMAGE (este script edita as duas últimas linhas)
#   /srv/plagea/<ambiente>/last-good-tag         <- tag da última versão saudável (para rollback)
set -euo pipefail

ENVIRONMENT="${1:?Uso: deploy.sh <staging|production> <tag-da-imagem>}"
IMAGE_TAG="${2:?Uso: deploy.sh <staging|production> <tag-da-imagem>}"

APP_DIR="/srv/plagea/${ENVIRONMENT}"
ENV_FILE="${APP_DIR}/.env"
LAST_GOOD_FILE="${APP_DIR}/last-good-tag"
REGISTRY="ghcr.io/zelitosaide/plagea"

if [ ! -f "${ENV_FILE}" ]; then
  echo "!! ${ENV_FILE} não existe. Cria-o primeiro (ver docs/DEPLOYMENT.md)." >&2
  exit 1
fi

cd "${APP_DIR}"

PREVIOUS_TAG="$(cat "${LAST_GOOD_FILE}" 2>/dev/null || true)"

echo "==> A apontar ${ENVIRONMENT} para a imagem ${REGISTRY}:${IMAGE_TAG}"
# Substitui (ou acrescenta) APP_IMAGE/MIGRATE_IMAGE no .env deste ambiente,
# sem tocar nas restantes linhas (MONGODB_URI, SESSION_SECRET, PORT, ...).
sed -i '/^APP_IMAGE=/d; /^MIGRATE_IMAGE=/d' "${ENV_FILE}"
{
  echo "APP_IMAGE=${REGISTRY}:${IMAGE_TAG}"
  echo "MIGRATE_IMAGE=${REGISTRY}:${IMAGE_TAG}-tools"
} >> "${ENV_FILE}"

echo "==> A puxar as imagens"
# Nomes de serviço explícitos — "migrate" está atrás de "profiles: [tools]"
# e um "docker compose pull" sem argumentos não o incluiria.
docker compose pull app
docker compose pull migrate

echo "==> A correr as migrações pendentes"
# Cada script é idempotente — seguro correr sempre, mesmo que já tenha
# corrido numa release anterior.
docker compose run --rm migrate scripts/migrate-departments.mjs
docker compose run --rm migrate scripts/migrate-equipment.mjs
docker compose run --rm migrate scripts/migrate-sample-slots.mjs

echo "==> A reiniciar plagea-app@${ENVIRONMENT}"
sudo systemctl restart "plagea-app@${ENVIRONMENT}.service"

APP_PORT="$(grep -E '^PORT=' "${ENV_FILE}" | tail -1 | cut -d= -f2)"
APP_PORT="${APP_PORT:-3000}"

echo "==> A verificar a saúde da aplicação em 127.0.0.1:${APP_PORT}/api/health"
HEALTHY=0
for _ in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [ "${HEALTHY}" -eq 1 ]; then
  echo "${IMAGE_TAG}" > "${LAST_GOOD_FILE}"
  echo "==> OK — ${ENVIRONMENT} actualizado para a tag ${IMAGE_TAG}"
  exit 0
fi

echo "!! Falhou o smoke test." >&2
if [ -n "${PREVIOUS_TAG}" ]; then
  echo "!! A repor a tag anterior: ${PREVIOUS_TAG}" >&2
  sed -i '/^APP_IMAGE=/d; /^MIGRATE_IMAGE=/d' "${ENV_FILE}"
  {
    echo "APP_IMAGE=${REGISTRY}:${PREVIOUS_TAG}"
    echo "MIGRATE_IMAGE=${REGISTRY}:${PREVIOUS_TAG}-tools"
  } >> "${ENV_FILE}"
  sudo systemctl restart "plagea-app@${ENVIRONMENT}.service"
else
  echo "!! Não havia tag anterior registada para repor — resolve manualmente." >&2
fi
exit 1
