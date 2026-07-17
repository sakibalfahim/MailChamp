import { SignJWT } from "jose";

export async function mintApiJWT(userId: string): Promise<string> {
  const raw = process.env.MAILCHAMP_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("MAILCHAMP_JWT_SECRET must be set and at least 32 characters");
  }
  const secret = new TextEncoder().encode(raw);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}
