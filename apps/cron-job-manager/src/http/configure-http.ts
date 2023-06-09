import axios from "axios";

import { createHttpAgent, createHttpsAgent } from "./create-http-agents";

/**
 * Register HTTP agents on the global `axios` object
 */
export function configureHttp(): void {
  axios.defaults.httpAgent = createHttpAgent();
  axios.defaults.httpsAgent = createHttpsAgent();
}
