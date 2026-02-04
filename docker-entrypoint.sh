#!/bin/sh

echo "Waiting for database..."
sleep 10

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting application..."
exec "$@"