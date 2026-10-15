// Migração para multi-tenancy: cria o departamento "Microbiologia" e
// atribui-o a todos os utilizadores/congeladores/amostras existentes.
// zelitosaide83@gmail.com passa a superadmin (sem departamento); os
// restantes utilizadores existentes ficam admin desse departamento.
//
// Uso:
//   MONGODB_URI="mongodb://..." MONGODB_DB="plagea" node scripts/migrate-departments.mjs
//
// Idempotente: pode ser corrido várias vezes sem duplicar o departamento
// nem reatribuir o que já está atribuído.

import { MongoClient } from "mongodb";

const DEPARTMENT_NAME = "Microbiologia";
const SUPERADMIN_EMAIL = "zelitosaide83@gmail.com";

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

  let department = await db.collection("departments").findOne({ name: DEPARTMENT_NAME });
  if (!department) {
    const now = new Date().toISOString();
    const result = await db.collection("departments").insertOne({
      name: DEPARTMENT_NAME,
      createdAt: now,
      updatedAt: now,
    });
    department = { _id: result.insertedId, name: DEPARTMENT_NAME };
    console.log(`Departamento criado: ${DEPARTMENT_NAME} (${department._id})`);
  } else {
    console.log(`Departamento já existe: ${DEPARTMENT_NAME} (${department._id})`);
  }

  const superAdminResult = await db.collection("users").updateOne(
    { email: SUPERADMIN_EMAIL },
    { $set: { role: "superadmin", departmentId: null, updatedAt: new Date().toISOString() } }
  );
  console.log(
    superAdminResult.matchedCount > 0
      ? `Promovido a superadmin: ${SUPERADMIN_EMAIL}`
      : `Aviso: utilizador ${SUPERADMIN_EMAIL} não encontrado.`
  );

  const usersResult = await db.collection("users").updateMany(
    { email: { $ne: SUPERADMIN_EMAIL }, departmentId: { $exists: false } },
    { $set: { departmentId: department._id.toString(), updatedAt: new Date().toISOString() } }
  );
  console.log(`Utilizadores atribuídos ao departamento: ${usersResult.modifiedCount}`);

  const freezersResult = await db.collection("freezers").updateMany(
    { departmentId: { $exists: false } },
    { $set: { departmentId: department._id.toString(), updatedAt: new Date().toISOString() } }
  );
  console.log(`Congeladores atribuídos ao departamento: ${freezersResult.modifiedCount}`);

  const samplesResult = await db.collection("samples").updateMany(
    { departmentId: { $exists: false } },
    { $set: { departmentId: department._id.toString(), updatedAt: new Date().toISOString() } }
  );
  console.log(`Amostras atribuídas ao departamento: ${samplesResult.modifiedCount}`);

  const boxesResult = await db.collection("boxes").updateMany(
    { departmentId: { $exists: false } },
    { $set: { departmentId: department._id.toString(), updatedAt: new Date().toISOString() } }
  );
  console.log(`Configurações de caixa atribuídas ao departamento: ${boxesResult.modifiedCount}`);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
