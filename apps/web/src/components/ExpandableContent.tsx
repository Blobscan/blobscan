/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import { Fragment, useEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

type ExpandableElementProps = {
  children: ReactNode;
};

const EXPANDABLE_THRESHOLD = 500;

export const ExpandableContent: FC<ExpandableElementProps> = function ({
  children,
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [opened, setOpened] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | undefined>();
  const isLargeContent = contentHeight
    ? contentHeight > EXPANDABLE_THRESHOLD
    : true;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.clientHeight);
    }
  }, []);

  return (
    <div className={`relative ${!opened && "max-h-[500px]"} overflow-hidden`}>
      <div ref={contentRef}>{children}</div>
      {isLargeContent && (
        <Fragment>
          {!opened && (
            <div
              className={`absolute bottom-0 left-0 m-0 w-full bg-gradient-to-b from-transparent to-surface-light py-24 text-center align-bottom dark:to-surface-dark dark:text-primary-400`}
            />
          )}
          <div
            className={`${
              !opened && "absolute bottom-3"
            } flex w-full justify-center font-bold`}
          >
            <div
              className="flex cursor-pointer items-center gap-1 text-primary-400 transition-colors hover:text-primary-300 "
              onClick={() => setOpened((opened) => !opened)}
            >
              Show More{" "}
              {opened ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
};
