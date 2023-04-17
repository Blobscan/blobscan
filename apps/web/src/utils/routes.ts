const ROUTES = {
  block: "/block",
  transaction: "/tx",
  blob: "/blob",
};

export function buildRoute(
  route: keyof typeof ROUTES,
  resource: string | number,
) {
  return `${ROUTES[route]}/${resource}`;
}
