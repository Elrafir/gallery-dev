#!/bin/bash
set -e

BACKUP_DIR="/home/alexey/GALLERY_BACKUP/backup_$(date +%Y%m%d_%H%M%S)"

echo "Creating backup directories in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/prod"
mkdir -p "$BACKUP_DIR/dev"

echo "Dumping PostgreSQL database (compressed format)..."
docker exec -i immich_postgres pg_dump -U postgres -d immich -Fc > "$BACKUP_DIR/database/immich_db.dump"

echo "Dumping PostgreSQL database (plain SQL format)..."
docker exec -i immich_postgres pg_dump -U postgres -d immich > "$BACKUP_DIR/database/immich_db.sql"

echo "Backing up production configuration..."
if [ -d "/home/alexey/immich-app" ]; then
    cp /home/alexey/immich-app/docker-compose.yml "$BACKUP_DIR/prod/"
    cp /home/alexey/immich-app/.env "$BACKUP_DIR/prod/"
    if [ -f "/home/alexey/immich-app/Копия (1) docker-compose.yml" ]; then
        cp "/home/alexey/immich-app/Копия (1) docker-compose.yml" "$BACKUP_DIR/prod/"
    fi
fi

echo "Backing up development configuration..."
cp -r /home/alexey/gallery-dev/docker "$BACKUP_DIR/dev/"
cp /home/alexey/gallery-dev/Makefile "$BACKUP_DIR/dev/"
cp /home/alexey/gallery-dev/package.json "$BACKUP_DIR/dev/"
cp /home/alexey/gallery-dev/pnpm-workspace.yaml "$BACKUP_DIR/dev/"
cp /home/alexey/gallery-dev/pnpm-lock.yaml "$BACKUP_DIR/dev/"
cp /home/alexey/gallery-dev/config_dump.json "$BACKUP_DIR/dev/"
if [ -f "/home/alexey/gallery-dev/mise.toml" ]; then
    cp /home/alexey/gallery-dev/mise.toml "$BACKUP_DIR/dev/"
fi
if [ -f "/home/alexey/gallery-dev/deployment/.env" ]; then
    mkdir -p "$BACKUP_DIR/dev/deployment"
    cp /home/alexey/gallery-dev/deployment/.env "$BACKUP_DIR/dev/deployment/"
fi

echo "Backup completed successfully at $BACKUP_DIR"
