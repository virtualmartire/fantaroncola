# FantaRoncola

## Dev

```bash
docker compose up -d --build
```

## Prod

Copy .env.production and then

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
