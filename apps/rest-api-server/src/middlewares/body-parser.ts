import bodyParser from "body-parser";

const REQUEST_BODY_LIMIT = "8mb";

export const bodyParserMiddleware = bodyParser.json({
  limit: REQUEST_BODY_LIMIT,
});
