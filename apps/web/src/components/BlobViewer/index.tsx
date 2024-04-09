import { useEffect, useRef, useState } from "react";
import type { FC } from "react";

import { hexStringToUtf8 } from "~/utils";
import { RawBlobView } from "./Views/RawBlobView";

export type BlobViewMode = "Raw" | "UTF-8";

export const DEFAULT_BLOB_VIEW_MODES: BlobViewMode[] = ["Raw", "UTF-8"];

export type BlobViewerProps = {
  selectedView: BlobViewMode;
  data?: string;
};

export type BlobViewProps = {
  data?: string | null;
  error?: string;
};

export const BlobViewer: FC<BlobViewerProps> = function ({
  data,
  selectedView,
}) {
  const utf8BlobViewRef = useRef<BlobViewProps>();
  const [blobViewProps, setBlobViewProps] = useState<BlobViewProps>();

  useEffect(() => {
    if (!data) {
      return;
    }

    if (selectedView === "UTF-8") {
      let blobViewProps: BlobViewProps | undefined = utf8BlobViewRef.current;

      if (!blobViewProps) {
        try {
          blobViewProps = { data: hexStringToUtf8(data) };
        } catch (err) {
          blobViewProps = {
            error: "Failed to decode blob to UTF-8",
          };
        }

        utf8BlobViewRef.current = blobViewProps;
      }

      setBlobViewProps(blobViewProps);
    } else if (selectedView === "Raw") {
      setBlobViewProps({ data: data });
    }
  }, [data, selectedView]);

  switch (selectedView) {
    case "Raw":
    case "UTF-8":
      return <RawBlobView {...blobViewProps} />;
  }
};
