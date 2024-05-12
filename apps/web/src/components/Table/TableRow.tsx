import { useState } from "react";
import type { FC, HTMLAttributes, ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import { Rotable } from "~/components/Rotable";
import { Button } from "../Button";
import { Collapsable } from "../Collapsable";
import { TableCell } from "./TableCell";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export interface ExpandableTableRowProps extends TableRowProps {
  expandItem: ReactNode;
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
        {expandItem && (
          <TableCell className="border-none">
            <Rotable
              angle={90}
              rotated={expandOpened}
              onClick={() => setExpandOpened((prevOpened) => !prevOpened)}
            >
              <Button variant="icon" icon={<ChevronRightIcon />} size="md" />
            </Rotable>
          </TableCell>
        )}
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
