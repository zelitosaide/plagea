import crypto from "crypto";
import { prisma } from "~/db/prisma";

export async function login(email: string, password: string) {
  const user = await prisma.account.findUnique({
    where: { email },
    include: { password: true }
  });

  if (!user || !user.password) {
    return false;
  }

  const hash = crypto
    .pbkdf2Sync(password, user.password.salt, 1000, 64, "sha256")
    .toString("hex");

  if (hash !== user.password.hash) {
    return false;
  }

  return user.id;
}