#!/bin/sh
# Set proper permissions for SFTP upload directory
# Ensure directory exists
mkdir -p /home/blobscan/upload
# Set ownership to blobscan user (UID 1001, GID 1001)
chown -R 1001:1001 /home/blobscan/upload
# Set permissions: owner can read/write/execute, group and others can read/execute
chmod -R 755 /home/blobscan/upload
