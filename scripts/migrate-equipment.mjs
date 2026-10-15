// Generaliza o modelo de dados para suportar vários tipos de equipamento
// de armazenamento (Congelador, Arquivo de Blocos, Arquivo de Lâminas):
//
// - Renomeia a colecção `freezers` para `equipment`, marcando cada
//   documento existente com type: "freezer" (mantém o mesmo _id, por
//   isso as referências freezerId em samples/boxes continuam válidas —
//   só o nome do campo muda, não o valor).
// - `samples`: freezerId/freezerCode/shelf/rightLeft/box -> equipmentId/
//   equipmentType/equipmentCode/path (array ordenado de níveis).
// - `boxes`: freezerId/shelf/rightLeft/box -> equipmentId/path/pathKey.
//
// Uso:
//   MONGODB_URI="mongodb://..." MONGODB_DB="plagea" node scripts/migrate-equipment.mjs
//
// Idempotente: cada passo só actua sobre documentos que ainda não têm os
// campos novos.

import { MongoClient } from "mongodb";

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

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  if (names.includes("freezers") && !names.includes("equipment")) {
    await db.collection("freezers").rename("equipment");
    console.log("Colecção freezers renomeada para equipment.");
  } else if (names.includes("equipment")) {
    console.log("Colecção equipment já existe — a saltar rename.");
  } else {
    console.log("Sem colecção freezers para migrar.");
  }

  if (names.includes("equipment") || names.includes("freezers")) {
    const typeResult = await db
      .collection("equipment")
      .updateMany({ type: { $exists: false } }, { $set: { type: "freezer" } });
    console.log(`Equipamento marcado como "freezer": ${typeResult.modifiedCount}`);
  }

  const samples = await db
    .collection("samples")
    .find({ equipmentId: { $exists: false }, freezerId: { $exists: true } })
    .toArray();

  for (const sample of samples) {
    const path = [sample.shelf, sample.rightLeft, sample.box].filter(Boolean);
    await db.collection("samples").updateOne(
      { _id: sample._id },
      {
        $set: {
          equipmentId: sample.freezerId,
          equipmentType: "freezer",
          equipmentCode: sample.freezerCode,
          path,
        },
        $unset: { freezerId: "", freezerCode: "", shelf: "", rightLeft: "", box: "" },
      }
    );
  }
  console.log(`Amostras migradas para o novo formato de localização: ${samples.length}`);

  const boxConfigs = await db
    .collection("boxes")
    .find({ equipmentId: { $exists: false }, freezerId: { $exists: true } })
    .toArray();

  for (const boxConfig of boxConfigs) {
    const path = [boxConfig.shelf, boxConfig.rightLeft, boxConfig.box].filter(Boolean);
    await db.collection("boxes").updateOne(
      { _id: boxConfig._id },
      {
        $set: { equipmentId: boxConfig.freezerId, path, pathKey: path.join("/") },
        $unset: { freezerId: "", shelf: "", rightLeft: "", box: "" },
      }
    );
  }
  console.log(`Configurações de caixa migradas para o novo formato: ${boxConfigs.length}`);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
