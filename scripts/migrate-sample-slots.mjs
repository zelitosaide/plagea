// Introduz o suporte a amostras com várias posições de armazenamento:
//
// - Cria a colecção `sample_slots` (um documento por posição ocupada) com
//   um índice único composto {equipmentId, pathKey, position} — é este
//   índice que passa a garantir, a nível de base de dados, que duas
//   amostras nunca ocupam a mesma posição.
// - `samples`: position (string, ex. "P5") -> positions (array de
//   números, ex. [5]), gerando o slot correspondente em sample_slots.
// - `equipment`: recalcula currentSamples a partir da contagem real de
//   slots (o significado do contador passa de "amostras" para "posições
//   ocupadas").
//
// Uso:
//   MONGODB_URI="mongodb://..." MONGODB_DB="plagea" node scripts/migrate-sample-slots.mjs
//
// Idempotente: só actua sobre amostras que ainda têm o campo `position`
// antigo. Uma colisão legada (duas amostras já na mesma posição, possível
// hoje porque o PATCH nunca validou isso) não aborta a migração — essa
// amostra fica assinalada no log para resolução manual.

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

  await db.collection("sample_slots").createIndex(
    { equipmentId: 1, pathKey: 1, position: 1 },
    { unique: true }
  );
  await db.collection("sample_slots").createIndex({ sampleId: 1 });
  console.log("Índices de sample_slots garantidos.");

  const samples = await db
    .collection("samples")
    .find({ position: { $exists: true } })
    .toArray();

  let migrated = 0;
  let skipped = 0;

  for (const sample of samples) {
    const path = sample.path || [];
    const pathKey = path.join("/");
    const position = Number.parseInt(String(sample.position).replace("P", ""), 10);

    if (Number.isNaN(position)) {
      console.warn(`Amostra ${sample._id}: posição "${sample.position}" inválida — a saltar.`);
      skipped++;
      continue;
    }

    try {
      await db.collection("sample_slots").insertOne({
        sampleId: sample._id,
        equipmentId: sample.equipmentId,
        pathKey,
        path,
        position,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error.code === 11000) {
        console.warn(
          `Colisão pré-existente na amostra ${sample._id} (posição ${position}) — position não migrada, resolver manualmente.`
        );
        skipped++;
        continue;
      }
      throw error;
    }

    await db.collection("samples").updateOne(
      { _id: sample._id },
      { $set: { positions: [position] }, $unset: { position: "" } }
    );
    migrated++;
  }

  console.log(`Amostras migradas: ${migrated}. Saltadas (precisam de resolução manual): ${skipped}.`);

  const equipmentList = await db.collection("equipment").find({}).toArray();
  for (const equipment of equipmentList) {
    const count = await db
      .collection("sample_slots")
      .countDocuments({ equipmentId: equipment._id.toString() });
    await db.collection("equipment").updateOne(
      { _id: equipment._id },
      { $set: { currentSamples: count } }
    );
  }
  console.log(`currentSamples recalculado para ${equipmentList.length} equipamento(s).`);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
