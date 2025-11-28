# SFTP SSH Keys

This directory contains hardcoded SSH keys for connecting to the local SFTP test server. **Both keys are committed to git** since this is only used for local testing and development.

## Files

- `blobscan` - Private SSH key (committed to git for test server)
- `blobscan.pub` - Public SSH key (mounted in SFTP container)

## Usage

### Docker Compose Setup

The public key (`blobscan.pub`) is automatically mounted into the SFTP container at `/home/blobscan/.ssh/keys/blobscan.pub` when you run:

```bash
docker compose -f docker-compose.local.yml up -d sftp
```

### Connecting to SFTP Server

The SFTP server runs on `localhost:2222` with:

- **Username**: `blobscan`
- **Password**: (none - uses key-based authentication)
- **Port**: `2222`

#### Using SFTP client:

```bash
sftp -i misc/ssh-keys/blobscan -P 2222 blobscan@localhost
```

#### Using SSH client:

```bash
ssh -i misc/ssh-keys/blobscan -p 2222 blobscan@localhost
```

### Environment Variables

For testing, you'll need to set these environment variables:

```bash
SFTP_STORAGE_HOST=localhost
SFTP_STORAGE_PORT=2222
SFTP_STORAGE_USERNAME=blobscan
SFTP_STORAGE_PATH=/home/blobscan/upload
SFTP_STORAGE_PRIVATE_KEY=$(cat misc/ssh-keys/blobscan)
```

### Regenerating Keys

If you need to regenerate the keys (not recommended - these are hardcoded test keys):

```bash
rm -f misc/ssh-keys/blobscan*
ssh-keygen -t ed25519 -f misc/ssh-keys/blobscan -N "" -C "blobscan-sftp-local"
git add misc/ssh-keys/blobscan misc/ssh-keys/blobscan.pub
```

**Note**: After regenerating, you'll need to restart the SFTP container for the new public key to be loaded:

```bash
docker compose -f docker-compose.local.yml restart sftp
```

**Security Note**: These keys are intentionally committed to the repository as they are only used for local testing. Do not use these keys in production environments.
