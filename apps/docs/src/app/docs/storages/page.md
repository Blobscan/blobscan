---
title: Available storages
nextjs:
  metadata:
    title: Available storages
    description: Supported storages for blobs
---

## Blob storages

Blobscan can be configured to use any of the following blob storages:

- S3
- Google Cloud Storage
- [Ethereum Swarm](https://www.ethswarm.org/)
- [Load Network (prev. WeaveVM)](https://www.load.network) (currently supports blob reading only)
- IPFS (read-only; CID references are registered externally by [blobscan-ipld](https://github.com/Blobscan/blobscan-ipld))
- PostgreSQL
- File system

By default all storages are disabled and you must enable at least one in order to run Blobscan. This is done using [environment variables](/docs/environment).

Note that the database size can grow quickly. For this reason, it is not recommended to choose PostgreSQL in production.

## Google Cloud Storage signed URLs

When `GOOGLE_STORAGE_SIGNED_URLS_ENABLED` is set to `true`, the API will return signed URLs for blobs stored in Google Cloud Storage instead of public URLs. Signed URLs provide time-limited access to private objects without requiring users to make the bucket publicly accessible.

If signing fails for a given object (for example, missing IAM permission), the API logs an error and falls back to the original URL — the request itself does not fail.

### Required service account permissions

The required permissions depend on what the Blobscan instance does. The same service account is used both for normal storage operations and for generating signed URLs.

#### Permissions matrix

| Permission               | Where granted | Read-only API instance                                                | Indexer / propagator (writes blobs) |
| ------------------------ | ------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `storage.objects.get`    | bucket        | ✅ — required to read blobs and to make signed URLs valid for clients | ✅                                  |
| `storage.objects.create` | bucket        |                                                                       | ✅ — required to upload blobs       |
| `storage.objects.delete` | bucket        |                                                                       | ✅ — required to remove blobs       |
| `storage.buckets.list`   | **project**   | ✅ — required by the startup health check                             | ✅                                  |

> The `storage.buckets.list` requirement comes from the bucket health check that runs at startup. It must be granted at **project** level (no bucket-scoped variant exists). If you cannot grant it project-wide, define a custom role with only that permission rather than using a broader predefined role.

#### Recommended predefined roles

- **Read-only API instance** (the one returning signed URLs):
  - `roles/storage.objectViewer` on the bucket (covers `objects.get`).
  - A custom project-level role with `storage.buckets.list`, **or** `roles/storage.admin` at project level (broader; only if you accept the tradeoff).
- **Indexer / propagator instance** (writes and deletes blobs):
  - `roles/storage.objectUser` on the bucket (covers `objects.create`, `get`, `delete`, `list`).
  - Same project-level `storage.buckets.list` requirement as above.

#### Granting via `gcloud`

```bash
# Bucket-level read access (read-only API)
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Bucket-level read + write (indexer / propagator)
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"

# Project-level custom role for the health check (least-privilege)
gcloud iam roles create blobscanBucketLister --project=YOUR_PROJECT \
  --title="Blobscan bucket lister" \
  --permissions=storage.buckets.list

gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="projects/YOUR_PROJECT/roles/blobscanBucketLister"
```

#### Granting via Cloud Console

1. **Bucket-scoped role**: Cloud Storage > Buckets > select bucket > Permissions > Grant access > pick **Storage Object Viewer** (read-only) or **Storage Object User** (read/write).
2. **Project-scoped bucket lister**: IAM & Admin > Roles > Create role with only `storage.buckets.list`. Then IAM & Admin > IAM > Grant access > assign the custom role to the service account.

### How signing works

Blobscan signs URLs with the v4 algorithm. To sign **without an extra API call**, the runtime needs the service account's RSA private key. Blobscan reads it from the base64-encoded JSON key in `GOOGLE_SERVICE_KEY`, so on any environment where you provide that env var (Docker, Kubernetes, bare metal) signing is local and self-contained — no additional GCP API call is made at sign time. The IAM grants the SA still needs are the ones in the matrix above (`objects.get` so the signed URL is honored when clients dereference it, plus the project-level `buckets.list` for the health check).

If you ever switch to credentials **without** an embedded private key (for example, Workload Identity Federation, GKE Workload Identity, or `gcloud` user creds), the GCS client falls back to the IAM `signBlob` API. In that case the identity also needs `roles/iam.serviceAccountTokenCreator` on itself (or the target service account) so it can call `iam.serviceAccounts.signBlob`. See [Google's signed URL docs](https://cloud.google.com/storage/docs/access-control/signed-urls) for details.

### Running on DigitalOcean Kubernetes (DOKS)

DOKS is not GKE, so there is no Workload Identity bridge to GCP. The simplest and recommended path is to keep using a service account **JSON key** mounted as an env var — local signing keeps working unchanged.

1. Create a service account in the GCP project and grant `roles/storage.objectViewer` on the bucket (see above).
2. Create a JSON key for that service account and base64-encode it:

   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
   base64 -w 0 key.json > key.b64
   ```

3. Store it as a Kubernetes secret:

   ```bash
   kubectl create secret generic blobscan-gcs \
     --from-file=GOOGLE_SERVICE_KEY=key.b64
   ```

4. Reference it from the API deployment:

   ```yaml
   env:
     - name: GOOGLE_STORAGE_ENABLED
       value: 'true'
     - name: GOOGLE_STORAGE_BUCKET_NAME
       value: your-bucket-name
     - name: GOOGLE_STORAGE_PROJECT_ID
       value: your-project-id
     - name: GOOGLE_STORAGE_SIGNED_URLS_ENABLED
       value: 'true'
     - name: GOOGLE_SERVICE_KEY
       valueFrom:
         secretKeyRef:
           name: blobscan-gcs
           key: GOOGLE_SERVICE_KEY
   ```

5. Rotate the key periodically (`gcloud iam service-accounts keys delete` + create new) and re-apply the secret. Treat the JSON key as a long-lived credential and never commit `key.json` to git.

If you prefer not to manage a long-lived key, you can use **Workload Identity Federation** with an OIDC provider on DOKS — but the cluster's pod identity has no private key, so signing falls through to the IAM `signBlob` API and you must additionally grant `roles/iam.serviceAccountTokenCreator` on the impersonated service account. This costs one extra API call per signed URL.

### URL expiration

Signed URLs are valid for 1 hour (3600 seconds). After expiration, the URL will no longer grant access to the blob; clients should re-fetch the API response to get a fresh URL.
