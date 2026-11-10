import type { AddressRole } from "./types";

export const ROLE_LABELS: Record<AddressRole, string> = {
  sent: "Sent",
  received: "Received",
};

/**
 * Returns the roles that the page shows. The received role shows only when
 * the address received a transaction that is not a self-send. Thus an address
 * that only sends to itself shows as a sender only.
 */
export function getShownRoles({
  sentTotalTransactions,
  receivedTotalTransactions,
  selfTotalTransactions,
}: {
  sentTotalTransactions: number;
  receivedTotalTransactions: number;
  selfTotalTransactions: number;
}): AddressRole[] {
  const roles: AddressRole[] = [];

  if (sentTotalTransactions > 0) {
    roles.push("sent");
  }

  if (receivedTotalTransactions > selfTotalTransactions) {
    roles.push("received");
  }

  return roles;
}

/**
 * Returns the main role (the shown role with more transactions) and the other
 * shown role, if there is one.
 */
export function getMainRole(
  roles: AddressRole[],
  totals: Record<AddressRole, { totalTransactions: number }>
): { main: AddressRole; other?: AddressRole } {
  const [first, second] = roles;

  if (!first) {
    return { main: "sent" };
  }

  if (!second) {
    return { main: first };
  }

  return totals.sent.totalTransactions >= totals.received.totalTransactions
    ? { main: "sent", other: "received" }
    : { main: "received", other: "sent" };
}
