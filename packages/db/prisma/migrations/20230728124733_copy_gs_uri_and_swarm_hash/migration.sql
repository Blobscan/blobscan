INSERT INTO "BlobDataStorageReference"
  ("blobHash", "blobStorage", "dataReference")
  SELECT
    b."versionedHash" AS "blobHash",
    'google'::"BlobStorage" AS "blobStorage",
    b."gsUri" AS "dataReference"
  FROM "Blob" AS b
  WHERE b."gsUri" IS NOT NULL
  UNION 
  SELECT b."versionedHash" AS "blobHash",
  'swarm'::"BlobStorage" AS "blobStorage",
  b."swarmHash" AS "dataReference"
  FROM "Blob" AS b
  WHERE b."swarmHash" IS NOT NULL;