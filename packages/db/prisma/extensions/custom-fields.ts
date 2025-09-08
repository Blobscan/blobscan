import { Prisma } from "@prisma/client";

export type BlobUrlFieldParams = {
  gcs?: Partial<{
    apiBaseUrl: string;
    bucketName: string;
  }>;
  s3: Partial<{
    apiBaseUrl: string;
    bucketName: string;
  }>;
  loadNetwork: Partial<{
    apiBaseUrl: string;
  }>;
  postgres: Partial<{
    apiBaseUrl: string;
  }>;
};

export type ExtensionConfig = {
  blobUrlField?: Partial<BlobUrlFieldParams>;
};

export const createCustomFieldsExtension = ({
  blobUrlField,
}: ExtensionConfig = {}) => {
  const { gcs, loadNetwork, postgres, s3 } =
    blobUrlField ?? ({} as BlobUrlFieldParams);
  return Prisma.defineExtension({
    name: "Custom Fields",
    result: {
      blobDataStorageReference: {
        url: {
          needs: {
            blobStorage: true,
            dataReference: true,
          },
          compute({ blobStorage, dataReference }) {
            switch (blobStorage) {
              case "GOOGLE": {
                if (!gcs?.bucketName) {
                  throw new Error(
                    "Couldn't compute gcs blob data url field: bucket name not provided"
                  );
                }
                return process.env.MODE === "test"
                  ? `${
                      gcs.apiBaseUrl ?? "http://localhost:4443"
                    }/storage/v1/b/${gcs.bucketName}/o/${encodeURIComponent(
                      dataReference
                    )}?alt=media`
                  : `https://storage.googleapis.com/${gcs.bucketName}/${dataReference}`;
              }
              case "POSTGRES": {
                if (!postgres?.apiBaseUrl) {
                  throw new Error(
                    "Couldn't compute postgres blob data url field: api base url not provided"
                  );
                }

                return `${postgres.apiBaseUrl}/blobs/${dataReference}/data`;
              }
              case "SWARM":
                return `https://api.gateway.ethswarm.org/bzz/${dataReference}`;
              case "WEAVEVM": {
                if (!loadNetwork?.apiBaseUrl) {
                  throw new Error(
                    "Couldn't compute load network blob data url field: api base url not provided"
                  );
                }
                return `${loadNetwork.apiBaseUrl}/v1/blob/${dataReference}`;
              }
              case "S3": {
                if (!s3?.apiBaseUrl || !s3.bucketName) {
                  throw new Error(
                    "Couldn't compute load network blob data url field: api base url or bucket name not provided"
                  );
                }
                return `${s3.apiBaseUrl}/${s3.bucketName}/${dataReference}`;
              }
            }
          },
        },
      },
    },
  });
};
