import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { animated, useSpring } from "@react-spring/web";

import dayjs from "~/dayjs";
import { type Transaction } from "~/types";
import { Link } from "../../Link";
import { SurfaceCardBase } from "../Bases";

type TransactionCardProps = {
  transaction: Transaction;
};

const AddressLabel: React.FC<{
  className?: HTMLAttributes<HTMLSpanElement>["className"];
  address: string;
}> = function ({ address, className }) {
  return (
    <Link href="#">
      {<span className={`truncate text-xs ${className ?? ""}`}>{address}</span>}
    </Link>
  );
};

const CollapseIcon: React.FC<{
  opened: boolean;
  onClick(): void;
}> = function ({ onClick, opened }) {
  const props = useSpring({
    from: { rotate: 0 },
    to: { rotate: Number(opened) * 180 },
  });

  return (
    <div className="flex cursor-pointer flex-col" onClick={onClick}>
      <animated.div style={props}>
        <ChevronUpIcon className="h-4 w-4" />
      </animated.div>
      <animated.div style={props}>
        <ChevronDownIcon className="h-4 w-4" />
      </animated.div>
    </div>
  );
};

export const TransactionCard: React.FC<TransactionCardProps> = function ({
  transaction: { hash, from, to, block, blockNumber, blobs },
}) {
  const [opened, setOpened] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentHeight = useRef<number>(0);
  const props = useSpring({
    from: { openProgress: 0 },
    to: { openProgress: Number(opened) },
  });

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      contentHeight.current = contentRef.current.clientHeight;
    }
  }, []);

  const handleContentRef = useCallback(
    (element: HTMLDivElement) => {
      contentRef.current = element;
      updateHeight();
    },
    [updateHeight],
  );

  useEffect(updateHeight, [opened, updateHeight]);

  return (
    <div>
      <SurfaceCardBase>
        <div className="p-4">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-3 ">
              <CollapseIcon
                opened={opened}
                onClick={() => {
                  setOpened((op) => !op);
                }}
              />
              <div className="flex w-full flex-col space-y-2">
                <div>
                  <span className="font-semibold">Transaction</span>{" "}
                  <Link href="#">{hash}</Link>
                </div>
                <div className="flex items-center space-x-2">
                  <AddressLabel address={from} />
                  <ArrowRightIcon className="h-2 w-2" />
                  <AddressLabel address={to} />
                </div>
                <div className="mb-2 text-sm">{blobs.length} Blobs</div>
              </div>
            </div>
            <div className="flex flex-col space-y-2 self-center">
              <Link href="#">
                <span>Block #{blockNumber}</span>
              </Link>
              <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
                {dayjs.unix(block.timestamp).fromNow()}
              </div>
            </div>
          </div>
        </div>
      </SurfaceCardBase>
      <div className="overflow-hidden dark:bg-primary-900">
        <animated.div
          style={{
            height: props.openProgress.to(
              (value) => `${value * contentHeight.current}px`,
            ),
          }}
        >
          <div
            ref={handleContentRef}
            className="ml-10 grid grid-cols-1 gap-2 p-2 text-sm"
          >
            <div className="font-semibold">Data Hash</div>
            {blobs.map((b) => (
              <div key={b.hash}>
                <Link href="#">{b.hash}</Link>
              </div>
            ))}
          </div>
        </animated.div>
      </div>
    </div>
  );
};
