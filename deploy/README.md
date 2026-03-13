# Deployment Layout

This folder is split by server role:

- `db/`: PostgreSQL container and backup/update scripts
- `was/`: Spring Boot API container
- `dmz/`: public WEB container
- `admin-office/`: internal admin WEB container
- `common/`: shared deploy helpers

## Quick Start (per server)

1. Copy `.env.example` to `.env` in each target folder and fill real values.
2. Run `chmod +x update.sh` (and `backup.sh` for DB) once.
3. Deploy/update with:

```bash
./update.sh
```

## Update Order

1. `db`: `./backup.sh` (mandatory before schema-impacting release)
2. `was`: `./update.sh`
3. `dmz`: `./update.sh`
4. `admin-office`: `./update.sh`
