import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import type { DecodedResultOf, Decoder } from "@blobscan/blob-decoder";

type BlobDecoderWorkerContextValue = {
  workerRef: React.MutableRefObject<Worker | undefined>;
};
const BlobDecoderWorkerContext = createContext<BlobDecoderWorkerContextValue>(
  {} as BlobDecoderWorkerContextValue
);

export function BlobDecoderWorkerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../blob-decoder.worker.ts", import.meta.url)
    );

    return () => {
      workerRef.current?.terminate();
    };
  });

  return (
    <BlobDecoderWorkerContext.Provider value={{ workerRef: workerRef }}>
      {children}
    </BlobDecoderWorkerContext.Provider>
  );
}

export function useBlobDecoderWorker<
  D extends Decoder,
  R extends DecodedResultOf<D>
>(
  blobData?: string,
  decoder?: D
): [R | undefined, { loading: boolean; error?: Error }] {
  const { workerRef } = useContext(BlobDecoderWorkerContext);
  const [decodedBlob, setDecodedBlob] = useState<R | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    const worker = workerRef?.current;
    if (!worker) {
      throw new Error(
        "useBlobDecoderWorker hook must be used within a BlobDecoderWorkerProvider"
      );
    }

    if (!blobData || !decoder) {
      return;
    }

    worker.onmessage = (event) => {
      setLoading(false);

      if (event.data.error) {
        setError(new Error(event.data.error));
        return;
      }

      setDecodedBlob(event.data.decodedBlob);
      setLoading(false);
    };

    worker.onmessageerror = (event) => {
      setError(new Error(event.toString()));
    };

    setLoading(true);
    worker.postMessage({ decoder, blobData });

    return () => {
      worker.onmessage = null;
      worker.onmessageerror = null;
    };
  }, [blobData, decoder]);

  return [decodedBlob, { loading, error }];
}
