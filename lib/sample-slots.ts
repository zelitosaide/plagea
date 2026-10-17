import { ObjectId, type Db } from "mongodb";
import { toPathKey } from "@/lib/equipment-types";

// Uma amostra pode ocupar várias posições na mesma caixa/linha/gaveta. Cada
// posição ocupada é um documento próprio nesta colecção, com um índice único
// composto {equipmentId, pathKey, position} — é esse índice, não lógica de
// aplicação, que garante que duas amostras nunca ocupam a mesma posição,
// mesmo sob escrita concorrente. `samples.positions` é só a cópia de
// leitura; esta colecção é a fonte de verdade da unicidade.

export type SlotConflict = {
  position: number;
  sampleId: string;
};

/** Procura, entre as posições pedidas, quais já estão ocupadas por outra
 * amostra na mesma caixa/linha/gaveta (equipmentId+path). */
export async function findConflicts(
  db: Db,
  equipmentId: string,
  path: string[],
  positions: number[],
  excludeSampleId?: ObjectId
): Promise<SlotConflict[]> {
  const pathKey = toPathKey(path);
  const query: Record<string, unknown> = {
    equipmentId,
    pathKey,
    position: { $in: positions },
  };
  if (excludeSampleId) {
    query.sampleId = { $ne: excludeSampleId };
  }

  const slots = await db.collection("sample_slots").find(query).toArray();
  return slots.map((slot) => ({ position: slot.position, sampleId: slot.sampleId.toString() }));
}

/** Reserva as posições pedidas, uma a uma. Se uma falhar por duplicado
 * (code 11000 — colisão só agora detectada pelo índice único, numa corrida
 * entre a pré-verificação e esta chamada), desfaz as que esta chamada já
 * tinha inserido e devolve os conflitos encontrados. */
export async function reserveSlots(
  db: Db,
  params: { sampleId: ObjectId; equipmentId: string; path: string[]; positions: number[] }
): Promise<{ ok: true } | { ok: false; conflicts: number[] }> {
  const { sampleId, equipmentId, path, positions } = params;
  const pathKey = toPathKey(path);
  const now = new Date().toISOString();
  const inserted: number[] = [];

  for (const position of positions) {
    try {
      await db.collection("sample_slots").insertOne({
        sampleId,
        equipmentId,
        pathKey,
        path,
        position,
        createdAt: now,
      });
      inserted.push(position);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        if (inserted.length > 0) {
          await db.collection("sample_slots").deleteMany({
            sampleId,
            equipmentId,
            pathKey,
            position: { $in: inserted },
          });
        }
        return { ok: false, conflicts: [position] };
      }
      throw error;
    }
  }

  return { ok: true };
}

export async function releaseSlots(db: Db, sampleId: ObjectId): Promise<void> {
  await db.collection("sample_slots").deleteMany({ sampleId });
}
