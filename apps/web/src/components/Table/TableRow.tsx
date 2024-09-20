import { useState } from "react";
import type { FC, HTMLAttributes, ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import { Rotable } from "~/components/Rotable";
import { Collapsable } from "../Collapsable";
import { IconButton } from "../IconButton";
import { TableCell } from "./TableCell";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export interface ExpandableTableRowProps extends TableRowProps {
  expandItem?: ReactNode;
}

export const TableRow: FC<TableRowProps> = function ({ children, ...props }) {
  return <tr {...props}>{children}</tr>;
};

export const ExpandableTableRow: FC<ExpandableTableRowProps> = function ({
  children,
  expandItem,
  ...props
}) {
  const [expandOpened, setExpandOpened] = useState(false);

  return (
    <>
      <TableRow {...props}>
        <TableCell className={expandItem ? `border-none` : "border-b"}>
          {expandItem ? (
            <Rotable
              angle={90}
              rotated={expandOpened}
              onClick={() => setExpandOpened((prevOpened) => !prevOpened)}
            >
              <IconButton>
                <ChevronRightIcon />
              </IconButton>
            </Rotable>
          ) : (
            <div>
              <div className="sr-only w-12 " />
            </div>
          )}
        </TableCell>
        {children}
      </TableRow>
      {expandItem && (
        <tr>
          <td colSpan={100} className="border-b dark:border-border-dark/40">
            <Collapsable opened={expandOpened}>{expandItem}</Collapsable>
          </td>
        </tr>
      )}
    </>
  );
};
