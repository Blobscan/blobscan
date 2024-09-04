import { useEffect, useRef, useState } from "react";
import type { FC } from "react";

import type { Decoder } from "@blobscan/blob-decoder";

import { useBlobDecoderWorker } from "~/providers/BlobDecoderWorker";
import { hexStringToUtf8 } from "~/utils";
import { Spinner } from "../Spinners/Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { RawBlobView, StarknetBlobView } from "./Views";

export type BlobViewMode = "Decoded" | "Raw" | "UTF-8";

export const DEFAULT_BLOB_VIEW_MODES = ["Raw", "UTF-8"] as const;

export type BlobViewerProps = {
  selectedView: BlobViewMode;
  data?: string;
  decoder?: Decoder;
};

export interface BlobViewProps<T> {
  data?: T | null;
}

export const BlobViewer: FC<BlobViewerProps> = function ({
  data,
  selectedView,
  decoder,
}) {
  const utf8DataRef = useRef<BlobViewProps<string>>();
  const [rawBlobViewData, setRawBlobViewData] =
    useState<BlobViewProps<string>>();
  const [error, setError] = useState<Error | string | undefined>();
  const [decodedBlob, { loading, error: decoderError }] = useBlobDecoderWorker(
    data,
    decoder
  );
  const error_ = decoderError ?? error;

  useEffect(() => {
    if (!data) {
      return;
    }

    if (selectedView === "UTF-8") {
      let blobData = utf8DataRef.current;

      if (!blobData) {
        try {
          const utf8Data = hexStringToUtf8(data);
          blobData = {
            data: utf8Data,
          };
        } catch (err) {
          setError("Failed to decode blob to UTF-8");
        }

        utf8DataRef.current = blobData;
      }

      setRawBlobViewData(blobData);
    } else if (selectedView === "Raw") {
      setRawBlobViewData({ data });
    }
  }, [data, selectedView]);

  switch (selectedView) {
    case "Raw":
    case "UTF-8":
      return <RawBlobView {...rawBlobViewData} />;
    case "Decoded": {
      if (!decoder) {
        throw new Error(
          "Decoder must be provided when selectedView is Decoded"
        );
      }

      if (loading) {
        return (
          <div className="flex h-36 items-center justify-center">
            <div>
              <Spinner label="Decoding Blob…" />
            </div>
          </div>
        );
      }

      if (error_) {
        return <ErrorMessage error={error_} />;
      }

      switch (decoder) {
        case "starknet":
          return (
            <div className="mt-10">
              <StarknetBlobView data={decodedBlob} />
            </div>
          );
      }
    }
  }
};
