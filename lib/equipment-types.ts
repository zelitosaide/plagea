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

/** Monta o código de localização completo, ex. "F1-S1-D-B1-P5" ou
 * "AB1-G3-L2-P15", a partir do código do equipamento, do path e da posição. */
export function buildLocationCode(equipmentCode: string, path: string[], position?: string): string {
  const parts = [equipmentCode, ...path];
  if (position) parts.push(position);
  return parts.join("-");
}
