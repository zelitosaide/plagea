// Relatório (só leitura, não altera nada) das amostras que ficaram de
// fora de scripts/migrate-sample-slots.mjs por colisão de posição —
// mostra, lado a lado, quem ficou com a posição ("ocupante actual", já
// em sample_slots) e quem não (ainda tem o campo `position` antigo),
// para uma pessoa com conhecimento do laboratório decidir caso a caso.
//
// Uso:
//   MONGODB_URI="mongodb://..." MONGODB_DB="plagea_staging" node scripts/report-sample-slot-collisions.mjs

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

  const unresolved = await db
    .collection("samples")
    .find({ position: { $exists: true } })
    .toArray();

  if (unresolved.length === 0) {
    console.log("Sem colisões pendentes — todas as amostras já têm `positions`.");
    await client.close();
    return;
  }

  console.log(`${unresolved.length} amostra(s) por resolver manualmente:\n`);

  for (const sample of unresolved) {
    const path = sample.path || [];
    const pathKey = path.join("/");
    const position = Number.parseInt(String(sample.position).replace("P", ""), 10);
    const locationLabel = `${sample.equipmentCode || sample.equipmentId}-${path.join("-")}-P${position}`;

    const slot = await db
      .collection("sample_slots")
      .findOne({ equipmentId: sample.equipmentId, pathKey, position });

    let occupant = null;
    if (slot) {
      occupant = await db.collection("samples").findOne({ _id: slot.sampleId });
    }

    console.log(`Posição ${locationLabel}`);
    console.log(
      `  SEM posição atribuída: ${sample.patientCode} | projecto: ${sample.project} | entrada: ${sample.entryDate} | validade: ${sample.expiryDate} | _id: ${sample._id}`
    );
    if (occupant) {
      console.log(
        `  OCUPANTE ACTUAL:       ${occupant.patientCode} | projecto: ${occupant.project} | entrada: ${occupant.entryDate} | validade: ${occupant.expiryDate} | _id: ${occupant._id}`
      );
    } else {
      console.log("  OCUPANTE ACTUAL:       (não encontrado em sample_slots — inesperado)");
    }
    console.log("");
  }

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
