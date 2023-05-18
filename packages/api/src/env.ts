const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not set");
}

const SECRET = SECRET_KEY;

export { SECRET };
