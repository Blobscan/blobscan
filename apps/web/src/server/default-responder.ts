import type { NextApiRequest, NextApiResponse } from "next";

import { HttpError } from "./HttpError";

type Handle<T> = (req: NextApiRequest, res: NextApiResponse) => Promise<T>;

function getServerErrorFromUnknown(err: unknown): HttpError {
  if (err instanceof Error) {
    return new HttpError({ cause: err, statusCode: 500 });
  }

  if (typeof err === "string") {
    return new HttpError({ message: err, statusCode: 500 });
  }

  return new HttpError({
    statusCode: 500,
    message: `Unhandled error of type ${typeof err} occurred`,
  });
}

/** Allows us to get type inference from API handler responses */
export function defaultResponder<T>(f: Handle<T>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await f(req, res);

      if (result) {
        res.json(result);
      }
    } catch (err) {
      console.error(err);
      const error = getServerErrorFromUnknown(err);
      res.statusCode = error.statusCode;
      res.json({ message: error.message });
    }
  };
}
