import crypto from "crypto";

import { prisma } from "~/db/prisma";

export async function accountExists(email: string) {
  const account = await prisma.account.findUnique({
    where: { email },
    select: { id: true },
  });

  return Boolean(account);
}

export async function createAccount(
  email: string,
  password: string,
) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha256")
    .toString("hex");

  return await prisma.account.create({
    data: {
      email: email,
      password: { 
        create: { 
          hash, 
          salt 
        } 
      },
    },
  });


  // accountExists(email);
  // const allUsers = await prisma.user.findMany();
  // console.log(allUsers);
  // const usuario = await prisma.usuario.create({
  //   data: { email, password }
  // })
  // const usuario = await prisma.usuario.create({
  //   data: { email, password }
  // })

  // console.log(usuario);

  // const usuarios = await prisma.usuario.findMany({
  //   include: {
  //     perfil: true
  //   }
  // });

  // console.log(usuarios);
  // return { id: 1 };
}