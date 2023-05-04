const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

const SECRET = NEXTAUTH_SECRET;

export { SECRET };
