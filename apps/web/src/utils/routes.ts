const ROUTES = {
  block: "/block",
  transaction: "/transaction",
  blob: "/blob",
};

export function buildRoute(route: keyof typeof ROUTES, resource: string) {
  return `${ROUTES[route]}/${resource}`;
}
