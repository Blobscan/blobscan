import { setupServer } from "msw/node";

export function createServer(handlers: Parameters<typeof setupServer>[0][]) {
  const server = setupServer(...handlers);

  server.listen();

  return () => {
    server.close();
  };
}
