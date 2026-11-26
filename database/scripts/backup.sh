#!/usr/bin/env bash
# =====================================================================
# Backup do MySQL: mysqldump compactado (.sql.gz) com retenção de 7 dias.
#
# Uso:  npm run backup        (ou: bash scripts/backup.sh)
#
# Lê a DATABASE_URL do ambiente ou do database/.env. Usa o mysqldump
# instalado na máquina; se não houver, usa o do container do
# docker-compose (MySQL local).
#
# Variáveis opcionais:
#   BACKUP_DIR             pasta dos arquivos (padrão: database/backups)
#   BACKUP_RETENTION_DAYS  dias mantidos     (padrão: 7)
#
# Para backup diário, agende este script (cron, Agendador de Tarefas ou o
# backup automático do provedor do MySQL gerenciado).
# =====================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# Carrega o .env sem sobrescrever variáveis já definidas no ambiente.
if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL não definida (veja o .env.example)}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Quebra mysql://usuario:senha@host:porta/banco?params em partes.
# (Senhas com caracteres especiais precisariam de decodificação de URL;
# por isso o .env.example pede senhas só com letras e números.)
rest="${DATABASE_URL#mysql://}"
credentials="${rest%%@*}"
location="${rest#*@}"
DB_USER="${credentials%%:*}"
DB_PASS="${credentials#*:}"
host_port="${location%%/*}"
DB_NAME="${location#*/}"
DB_NAME="${DB_NAME%%\?*}"
DB_HOST="${host_port%%:*}"
DB_PORT="${host_port##*:}"
[[ "$DB_PORT" == "$host_port" ]] && DB_PORT=3306

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${DB_NAME}-$(date -u +%Y%m%d-%H%M%S).sql.gz"

# Se o dump falhar no meio, apaga o arquivo incompleto.
trap 'rm -f "$file"; echo "Backup falhou." >&2' ERR

# --single-transaction: cópia consistente sem travar as tabelas (InnoDB).
# --no-tablespaces: dispensa o privilégio PROCESS, que provedores gerenciados negam.
dump_options=(--single-transaction --routines --triggers --no-tablespaces --default-character-set=utf8mb4)

if command -v mysqldump >/dev/null 2>&1; then
  MYSQL_PWD="$DB_PASS" mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
    "${dump_options[@]}" "$DB_NAME" | gzip > "$file"
else
  # Sem mysqldump local: usa o do container (o banco precisa estar ligado).
  docker compose exec -T -e MYSQL_PWD="$DB_PASS" mysql \
    mysqldump -h 127.0.0.1 -u "$DB_USER" "${dump_options[@]}" "$DB_NAME" | gzip > "$file"
fi

trap - ERR
echo "Backup criado: $file"

# Retenção: apaga backups com mais de RETENTION_DAYS dias.
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime +"$((RETENTION_DAYS - 1))" -print -delete
