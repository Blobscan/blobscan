import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import type { Rollup } from "~/types";

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

export function useBlobDecoderWorker(
  blobData?: string,
  rollup?: Rollup | null
): [string | undefined | null, { loading: boolean; error?: Error }] {
  const { workerRef } = useContext(BlobDecoderWorkerContext);
  const [decodedBlob, setDecodedBlob] = useState<string | undefined | null>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    const worker = workerRef?.current;
    if (!worker) {
      throw new Error(
        "useBlobDecoderWorker hook must be used within a BlobDecoderWorkerProvider"
      );
    }

    if (!blobData || !rollup) {
      return;
    }

    worker.onmessage = (event) => {
      setDecodedBlob(event.data);
      setLoading(false);
    };

    worker.onmessageerror = (event) => {
      setError(new Error(event.toString()));
    };

    setLoading(true);
    worker.postMessage({ rollup, blobData });

    return () => {
      worker.onmessage = null;
      worker.onmessageerror = null;
    };
  }, [blobData, rollup]);

  return [decodedBlob, { loading, error }];
}
