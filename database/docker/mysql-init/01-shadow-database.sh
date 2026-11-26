#!/bin/bash
# Roda uma única vez, quando o volume do MySQL é criado.
# Cria o banco "shadow" que o `prisma migrate dev` usa para conferir as
# migrações e dá ao usuário da aplicação acesso a ele.
set -euo pipefail

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS portfolio_shadow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON portfolio_shadow.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
