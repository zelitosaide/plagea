// Seed inicial dos 4 utilizadores anteriormente hardcoded no login (lista de
// emails em app/login/page.tsx), agora como contas reais na colecção `users`.
// Password inicial = email, igual ao comportamento antigo; recomenda-se
// trocar a password depois do primeiro login através do painel de admin.
//
// Uso:
//   MONGODB_URI="mongodb://..." MONGODB_DB="plagea" node scripts/seed-users.mjs
// ou, com Node 20.6+, colocando as variáveis num .env.local:
//   node --env-file=.env.local scripts/seed-users.mjs
//
// Idempotente: pode ser corrido várias vezes, só cria contas que ainda não existem.

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const INITIAL_ADMINS = [
  { name: "Marilia Sufiana", email: "mariliasufiana@gmail.com" },
  { name: "Passanduca", email: "passanduca@gmail.com" },
  { name: "Jahit Yash", email: "jahityash2002@gmail.com" },
  { name: "Zelito Saide", email: "zelitosaide83@gmail.com" },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Defina MONGODB_URI antes de correr este script.");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB || "plagea";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  for (const admin of INITIAL_ADMINS) {
    const email = admin.email.toLowerCase();
    const existing = await users.findOne({ email });
    if (existing) {
      console.log(`Já existe: ${email} — ignorado.`);
      continue;
    }

    const now = new Date().toISOString();
    await users.insertOne({
      name: admin.name,
      email,
      passwordHash: await bcrypt.hash(admin.email, 10),
      role: "admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Criado: ${email}`);
  }

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
