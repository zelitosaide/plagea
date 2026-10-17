// Define, em código (não na base de dados), a estrutura de localização de
// cada tipo de equipamento de armazenamento. Não é configurável por
// utilizador — reflecte a organização física real de cada tipo de arquivo.

export type EquipmentType = "freezer" | "ab" | "al";

export type LocationLevel = {
  key: string;
  label: string;
  prefix: string;
  kind: "number" | "select";
  options?: string[];
};

export type EquipmentTypeConfig = {
  type: EquipmentType;
  label: string;
  prefix: string;
  hasTemperature: boolean;
  levels: LocationLevel[];
  /**
   * "grid": o último nível (ex. Box do congelador) é uma grelha 2D de
   * posições, com linhas e colunas configuráveis.
   * "sequence": o último nível (Linha do AB, Gaveta do AL) é uma fila
   * simples numerada 1..N — fisicamente uma única linha, nunca um
   * quadrado. O PositionPicker é o mesmo; só muda rows (sempre 1) e
   * columns (= N).
   */
  positionLayout: "grid" | "sequence";
  defaultBoxRows: number;
  defaultBoxColumns: number;
};

export const EQUIPMENT_TYPES: Record<EquipmentType, EquipmentTypeConfig> = {
  freezer: {
    type: "freezer",
    label: "Congelador",
    prefix: "F",
    hasTemperature: true,
    levels: [
      { key: "shelf", label: "Prateleira", prefix: "S", kind: "number" },
      { key: "side", label: "Lado", prefix: "", kind: "select", options: ["D", "E"] },
      { key: "box", label: "Box", prefix: "B", kind: "number" },
    ],
    positionLayout: "grid",
    defaultBoxRows: 9,
    defaultBoxColumns: 9,
  },
  ab: {
    type: "ab",
    label: "Arquivo de Blocos",
    prefix: "AB",
    hasTemperature: false,
    levels: [
      { key: "drawer", label: "Gaveta", prefix: "G", kind: "number" },
      { key: "line", label: "Linha", prefix: "L", kind: "number" },
    ],
    positionLayout: "sequence",
    defaultBoxRows: 1,
    defaultBoxColumns: 20,
  },
  al: {
    type: "al",
    label: "Arquivo de Lâminas",
    prefix: "AL",
    hasTemperature: false,
    levels: [
      { key: "drawer", label: "Gaveta", prefix: "G", kind: "number" },
    ],
    positionLayout: "sequence",
    defaultBoxRows: 1,
    defaultBoxColumns: 40,
  },
};

export const EQUIPMENT_TYPE_LIST = Object.values(EQUIPMENT_TYPES);

export function getEquipmentTypeConfig(type: string): EquipmentTypeConfig {
  return EQUIPMENT_TYPES[type as EquipmentType] || EQUIPMENT_TYPES.freezer;
}

/** Serializa um array de valores de nível (ex.: ["S1","D","B1"]) para a
 * chave usada na colecção `boxes` (configuração de posições). */
export function toPathKey(path: string[]): string {
  return path.join("/");
}

/** Comprime um array de posições ordenadas em blocos contíguos para
 * apresentação, ex. [1,2,3,4,6,7] -> "P1-4,P6-7". Só para visualização —
 * nunca deve ser parseada de volta (a fonte de dados é sempre o array
 * `positions` original). */
export function formatPositions(positions: number[]): string {
  if (!positions || positions.length === 0) return "";
  const sorted = [...positions].sort((a, b) => a - b);
  const blocks: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === end + 1) {
      end = current;
      continue;
    }
    blocks.push(start === end ? `P${start}` : `P${start}-${end}`);
    if (current !== undefined) {
      start = current;
      end = current;
    }
  }

  return blocks.join(",");
}

/** Monta o código de localização completo, ex. "F1-S1-D-B1-P5" ou
 * "AB1-G3-L2-P1-4,P6-7", a partir do código do equipamento, do path e das
 * posições ocupadas. */
export function buildLocationCode(equipmentCode: string, path: string[], positions?: number[]): string {
  const parts = [equipmentCode, ...path];
  if (positions && positions.length > 0) parts.push(formatPositions(positions));
  return parts.join("-");
}
