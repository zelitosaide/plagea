"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertTriangle,
  CalendarIcon,
  Info,
  Save,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PositionPicker } from "@/components/position-picker";
import { TimePicker } from "@/components/time-picker";
import { BoxDimensionsEditor } from "@/components/box-dimensions-editor";
import {
  EQUIPMENT_TYPES,
  buildLocationCode,
  formatPositions,
  getEquipmentTypeConfig,
  toPathKey,
  type EquipmentType,
} from "@/lib/equipment-types";

// Tipos de amostra sólidos — não são guardados num criotubo, por isso não
// faz sentido pedir uma quantidade em mL.
const SOLID_SAMPLE_TYPES = ["Tissue", "Bloco", "Lamina"];

type Equipment = {
  _id: string;
  code: string;
  name: string;
  type: EquipmentType;
  status: "operational" | "maintenance" | "offline";
};

type BoxConfig = {
  rows: number;
  columns: number;
};

type ExistingSample = {
  _id: string;
  patientCode: string;
  path: string[];
  positions: number[];
};

export default function EditSamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(true);
  const [showEntryCalendar, setShowEntryCalendar] = useState(false);
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [formData, setFormData] = useState({
    patientCode: "",
    sampleType: "",
    customSampleType: "",
    sampleQuantity: "",
    project: "",
    equipmentId: "",
    equipmentCode: "",
    equipmentType: "freezer" as EquipmentType,
    levelValues: {} as Record<string, string>,
    selectedPositions: [] as number[],
    positionCount: "1",
    notes: "",
    entryDate: "",
    expiryDate: "",
    labEntryTime: "",
    freezerStorageTime: "",
  });

  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date>();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [customSampleTypes, setCustomSampleTypes] = useState<string[]>([]);
  const [equipmentSamples, setEquipmentSamples] = useState<ExistingSample[]>([]);
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [boxConfigLoading, setBoxConfigLoading] = useState(false);
  const [editingBoxDimensions, setEditingBoxDimensions] = useState(false);
  const [savingBoxDimensions, setSavingBoxDimensions] = useState(false);

  const typeConfig = getEquipmentTypeConfig(formData.equipmentType);
  const path = typeConfig.levels.map((level) => formData.levelValues[level.key] || "");
  const pathComplete = path.every(Boolean);
  const isSolidSample = SOLID_SAMPLE_TYPES.includes(formData.sampleType);

  const fetchSampleById = async () => {
    try {
      const response = await fetch(`/api/samples/${id}`);
      if (response.ok) {
        const data = await response.json();

        // Check if the sample type is a custom one (not in the predefined list)
        const predefinedTypes = [
          "Lavado brocoaveolar",
          "Blood Serum",
          "Plasma",
          "DNA",
          "RNA",
          "Tissue",
          "Urine",
          "Saliva",
          "Bloco",
          "Lamina",
          "Aspirado celular",
        ];

        // Also check if it's in the loaded custom types
        const isInCustomTypes = customSampleTypes.includes(data.sampleType);
        const isInPredefinedTypes = predefinedTypes.includes(data.sampleType);

        const sampleTypeConfig = getEquipmentTypeConfig(data.equipmentType || "freezer");
        const levelValues: Record<string, string> = {};
        sampleTypeConfig.levels.forEach((level, index) => {
          if (data.path?.[index]) levelValues[level.key] = data.path[index];
        });

        const selectedPositions: number[] = data.positions || [];
        const baseData = {
          ...data,
          equipmentType: data.equipmentType || "freezer",
          levelValues,
          selectedPositions,
          positionCount: selectedPositions.length > 0 ? selectedPositions.length.toString() : "1",
        };

        if (data.sampleType && !isInPredefinedTypes && !isInCustomTypes) {
          // It's a custom type that's not in our current custom types list
          // This can happen if the type was removed from settings but still exists in samples
          setFormData((prev) => ({
            ...prev,
            ...baseData,
            sampleType: "custom",
            customSampleType: data.sampleType,
          }));
        } else if (isInCustomTypes) {
          // It's a known custom type
          setFormData((prev) => ({
            ...prev,
            ...baseData,
            sampleType: data.sampleType, // Keep it as the custom type value
            customSampleType: "", // Clear this since it's not "custom" selector
          }));
        } else {
          // It's a predefined type
          setFormData((prev) => ({ ...prev, ...baseData }));
        }

        // Sincroniza os objectos Date usados pelo calendário e pela
        // validação de envio — setFormData só preenche as strings usadas
        // para mostrar o texto no botão.
        if (data.entryDate) setEntryDate(new Date(data.entryDate));
        if (data.expiryDate) setExpiryDate(new Date(data.expiryDate));

        console.log(data);
      }
    } catch (error) {
      toast.error("Falha ao buscar a amostra");
      console.log("Error fetching sample:", error);
    } finally {
      // setLoading(false)
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment");
      if (response.ok) {
        const data = await response.json();
        setEquipmentList(data);
        console.log(data);
      }
    } catch (error) {
      toast.error("Falha ao buscar equipamento");
      console.log("Error fetching equipment:", error);
    } finally {
      // setLoading(false)
    }
  };

  const loadCustomSampleTypes = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        console.log("Loaded custom sample types:", data);
        setCustomSampleTypes(data);
      } else {
        console.log(
          "Failed to load custom sample types, status:",
          response.status
        );
      }
    } catch (error) {
      console.log("Error loading custom sample types:", error);
    }
  };

  const saveCustomSampleType = async (customType: string) => {
    try {
      console.log("Saving custom sample type:", customType);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customSampleType: customType }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Custom sample type saved successfully:", result);
        setCustomSampleTypes(result.customSampleTypes);
        return true;
      } else {
        const error = await response.json();
        console.log("Error saving custom sample type:", error.error);
        return false;
      }
    } catch (error) {
      console.log("Error saving custom sample type:", error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setSampleLoading(true);
      try {
        await Promise.all([fetchEquipment(), loadCustomSampleTypes()]);
        // Load sample data after custom types are loaded
        await fetchSampleById();
      } finally {
        setSampleLoading(false);
      }
    };

    initializeData();
  }, [id]);

  // Carrega as amostras já guardadas no equipamento seleccionado, para
  // mostrar quais posições estão ocupadas/livres (excluindo esta própria
  // amostra, que já ocupa uma posição).
  useEffect(() => {
    if (!formData.equipmentId) {
      setEquipmentSamples([]);
      return;
    }

    fetch(`/api/samples?equipmentId=${formData.equipmentId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((samples: ExistingSample[]) =>
        setEquipmentSamples(samples.filter((sample) => sample._id !== id))
      )
      .catch(() => setEquipmentSamples([]));
  }, [formData.equipmentId, id]);

  // Carrega as dimensões guardadas para esta caixa específica
  // (equipmentId+path). Cada caixa/linha/gaveta é independente: uma
  // caixa de 9x9 e outra de 10x10 no mesmo equipamento são normais.
  useEffect(() => {
    setEditingBoxDimensions(false);

    if (!formData.equipmentId || !pathComplete) {
      setBoxConfig(null);
      setBoxConfigLoading(false);
      return;
    }

    const params = new URLSearchParams({
      equipmentId: formData.equipmentId,
      path: toPathKey(path),
    });

    setBoxConfigLoading(true);
    fetch(`/api/boxes?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setBoxConfig(data ? { rows: data.rows, columns: data.columns } : null))
      .catch(() => setBoxConfig(null))
      .finally(() => setBoxConfigLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.equipmentId, toPathKey(path)]);

  const handleSaveBoxDimensions = async (rows: number, columns: number) => {
    setSavingBoxDimensions(true);
    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: formData.equipmentId,
          path,
          rows,
          columns,
        }),
      });

      if (response.ok) {
        setBoxConfig({ rows, columns });
        setEditingBoxDimensions(false);
      } else {
        toast.error("Falha ao guardar as dimensões da caixa");
      }
    } catch (error) {
      console.error("Error saving box dimensions:", error);
      toast.error("Falha ao guardar as dimensões da caixa");
    } finally {
      setSavingBoxDimensions(false);
    }
  };

  const occupiedInCurrentBox = pathComplete
    ? equipmentSamples
        .filter((sample) => JSON.stringify(sample.path) === JSON.stringify(path))
        .flatMap((sample) =>
          (sample.positions || []).map((position) => ({
            position,
            patientCode: sample.patientCode,
          }))
        )
    : [];

  const boxRows = boxConfig?.rows || typeConfig.defaultBoxRows;
  const boxColumns = boxConfig?.columns || typeConfig.defaultBoxColumns;

  const occupiedConflicts = occupiedInCurrentBox.filter((slot) =>
    formData.selectedPositions.includes(slot.position)
  );

  const handleSelectPosition = (pos: number) => {
    const occupiedPositions = new Set(occupiedInCurrentBox.map((slot) => slot.position));

    if (formData.selectedPositions.length === 0) {
      const count = Math.max(1, Number.parseInt(formData.positionCount, 10) || 1);
      const block: number[] = [];
      for (let p = pos; block.length < count; p++) {
        if (occupiedPositions.has(p)) break;
        block.push(p);
      }
      if (block.length === 0) return;
      if (block.length < count) {
        toast.error(`Só há ${block.length} posição(ões) livre(s) consecutiva(s) a partir daqui.`);
      }
      setFormData((prev) => ({ ...prev, selectedPositions: block, positionCount: block.length.toString() }));
      return;
    }

    setFormData((prev) => {
      const selectedPositions = prev.selectedPositions.includes(pos)
        ? prev.selectedPositions.filter((p) => p !== pos)
        : [...prev.selectedPositions, pos].sort((a, b) => a - b);
      return { ...prev, selectedPositions, positionCount: selectedPositions.length.toString() };
    });
  };

  /** O campo "Nr. posições" funciona nos dois sentidos: seleccionar/
   * desseleccionar na grelha actualiza-o (ver handleSelectPosition); e
   * escrever aqui um número redimensiona a selecção — encolhe a partir do
   * fim, ou cresce acrescentando as próximas posições livres depois da
   * última seleccionada. */
  const handlePositionCountChange = (value: string) => {
    const count = Number.parseInt(value, 10);

    if (!value || !Number.isInteger(count) || count <= 0) {
      setFormData((prev) => ({ ...prev, positionCount: value }));
      return;
    }

    const current = formData.selectedPositions;

    if (count <= current.length) {
      setFormData((prev) => ({
        ...prev,
        positionCount: value,
        selectedPositions: current.slice(0, count),
      }));
      return;
    }

    const occupiedPositions = new Set(occupiedInCurrentBox.map((slot) => slot.position));
    const maxPos = boxRows * boxColumns;
    const needed = count - current.length;
    const additions: number[] = [];
    let p = current.length > 0 ? Math.max(...current) + 1 : 1;
    while (additions.length < needed && p <= maxPos) {
      if (!occupiedPositions.has(p) && !current.includes(p)) additions.push(p);
      p++;
    }
    if (additions.length < needed) {
      toast.error(`Só há ${current.length + additions.length} posição(ões) livre(s) disponível(eis).`);
    }

    setFormData((prev) => ({
      ...prev,
      positionCount: value,
      selectedPositions: [...current, ...additions].sort((a, b) => a - b),
    }));
  };

  const locationComplete =
    !!formData.equipmentId && pathComplete && formData.selectedPositions.length > 0;
  const locationPreview = locationComplete
    ? buildLocationCode(formData.equipmentCode, path, formData.selectedPositions)
    : null;

  const legendExample = [
    `${typeConfig.prefix}1`,
    ...typeConfig.levels.map((level) => (level.kind === "select" ? level.options?.[0] || "" : `${level.prefix}1`)),
    "P1",
  ].join("-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (occupiedConflicts.length > 0) {
      toast.error(
        `As posições ${occupiedConflicts
          .map((c) => `P${c.position}`)
          .join(", ")} já estão ocupadas. Escolha outras posições.`
      );
      return;
    }

    // Determine the final sample type to use
    const finalSampleType =
      formData.sampleType === "custom"
        ? formData.customSampleType
        : formData.sampleType;

    if (!entryDate) {
      toast.error("Seleccione a data de entrada");
      return;
    }

    if (!pathComplete || !formData.equipmentId || formData.selectedPositions.length === 0) {
      toast.error("Por favor, preencha todos campos obrigatórios");
      return;
    }

    // Validate sample quantity specifically (não aplicável a amostras sólidas)
    if (!isSolidSample && (!formData.sampleQuantity || parseFloat(formData.sampleQuantity) <= 0)) {
      toast.error("Por favor, insira uma quantidade válida da amostra (maior que 0)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/samples/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientCode: formData.patientCode,
          sampleType: finalSampleType,
          sampleQuantity: formData.sampleQuantity,
          project: formData.project,
          equipmentId: formData.equipmentId,
          equipmentCode: formData.equipmentCode,
          equipmentType: formData.equipmentType,
          path,
          positions: formData.selectedPositions,
          notes: formData.notes,
          labEntryTime: formData.labEntryTime,
          freezerStorageTime: formData.freezerStorageTime,
          entryDate: entryDate.toISOString().split("T")[0],
          expiryDate: expiryDate?.toISOString().split("T")[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Falha ao actualizar a amostra");
        return;
      }

      // Save custom sample type if it's new
      if (
        formData.sampleType === "custom" &&
        formData.customSampleType.trim()
      ) {
        const newCustomType = formData.customSampleType.trim();
        if (!customSampleTypes.includes(newCustomType)) {
          await saveCustomSampleType(newCustomType);
        }
      }

      toast.success("Amostra actualizada com sucesso!");
      router.push(`/samples/${id}`);
    } catch (error) {
      console.error("Error updating sample:", error);
      toast.error("Falha ao actualizar a amostra");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "sampleType") {
      setFormData((prev) => ({
        ...prev,
        sampleType: value,
        // Reset custom sample type when a predefined option is selected
        customSampleType: value !== "custom" ? "" : prev.customSampleType,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEquipmentChange = (value: string) => {
    const [code, equipId, type] = value.split(":");
    setFormData((prev) => ({
      ...prev,
      equipmentId: equipId,
      equipmentCode: code,
      equipmentType: (type as EquipmentType) || "freezer",
      levelValues: {},
      selectedPositions: [],
    }));
  };

  const handleLevelChange = (levelKey: string, prefix: string, kind: "number" | "select", rawValue: string) => {
    const value = kind === "select" ? rawValue : `${prefix}${rawValue}`;
    setFormData((prev) => ({
      ...prev,
      levelValues: { ...prev.levelValues, [levelKey]: value },
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateCalendar = (
    currentDate: Date,
    onDateSelect: (date: Date) => void,
    onClose: () => void
  ) => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md shadow-md p-3 z-50 w-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              onDateSelect(newDate);
            }}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {monthNames[month]} {year}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              onDateSelect(newDate);
            }}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center p-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === today.toDateString();
            const isSelected =
              day.toDateString() === currentDate.toDateString();

            return (
              <Button
                key={index}
                type="button"
                variant="ghost"
                onClick={() => {
                  onDateSelect(day);
                  onClose();
                }}
                className={cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  isToday && "bg-accent text-accent-foreground",
                  isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                )}
              >
                {day.getDate()}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/samples">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Amostras
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar Amostra</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/samples">
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            form="sample-edit-form"
            className="flex items-center gap-2"
            disabled={loading || sampleLoading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Atualizar Amostra
              </>
            )}
          </Button>
        </div>
      </div>

      <form id="sample-edit-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sample Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Amostra</CardTitle>
                <CardDescription>Atualizar detalhes da amostra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientCode">Código do Paciente *</Label>
                  <Input
                    id="patientCode"
                    value={formData.patientCode}
                    onChange={(e) =>
                      handleInputChange("patientCode", e.target.value)
                    }
                    placeholder="PT-2024-001"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sampleType">Tipo de Amostra *</Label>
                    <Select
                      value={
                        formData.sampleType === "custom"
                          ? "custom"
                          : formData.sampleType
                      }
                      onValueChange={(value) =>
                        handleInputChange("sampleType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de amostra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lavado brocoaveolar">
                          Lavado brocoaveolar
                        </SelectItem>
                        <SelectItem value="Blood Serum">
                          Soro Sanguíneo
                        </SelectItem>
                        <SelectItem value="Plasma">Plasma</SelectItem>
                        <SelectItem value="DNA">DNA</SelectItem>
                        <SelectItem value="RNA">RNA</SelectItem>
                        <SelectItem value="Tissue">Tecido</SelectItem>
                        <SelectItem value="Urine">Urina</SelectItem>
                        <SelectItem value="Saliva">Saliva</SelectItem>
                        <SelectItem value="Bloco">Bloco</SelectItem>
                        <SelectItem value="Lamina">Lâmina</SelectItem>
                        <SelectItem value="Aspirado celular">
                          Aspirado celular
                        </SelectItem>
                        {/* Custom sample types */}
                        {customSampleTypes.map((customType, index) => (
                          <SelectItem
                            key={`custom-${index}`}
                            value={customType}
                          >
                            {customType}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          Outro (especificar)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.sampleType === "custom" && (
                      <Input
                        placeholder="Digite o tipo de amostra personalizado"
                        value={formData.customSampleType || ""}
                        onChange={(e) =>
                          handleInputChange("customSampleType", e.target.value)
                        }
                        className="mt-2"
                      />
                    )}
                  </div>

                  {!isSolidSample && (
                    <div className="space-y-2">
                      <Label htmlFor="sampleQuantity">
                        Quantidade no Criotubo (mL) *
                      </Label>
                      <Input
                        id="sampleQuantity"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.sampleQuantity}
                        onChange={(e) =>
                          handleInputChange("sampleQuantity", e.target.value)
                        }
                        placeholder="Ex: 1.5"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projecto *</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) =>
                      handleInputChange("project", e.target.value)
                    }
                    placeholder="Nome do Projecto"
                    // required
                  />
                </div>

                <div className="relative space-y-2">
                  <Label>Data de Entrada *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEntryCalendar(!showEntryCalendar);
                      setShowExpiryCalendar(false);
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.entryDate
                      ? formatDate(new Date(formData.entryDate))
                      : "Selecione uma data"}
                  </Button>
                  {showEntryCalendar &&
                    generateCalendar(entryDate, setEntryDate, () =>
                      setShowEntryCalendar(false)
                    )}
                </div>

                <div className="relative space-y-2">
                  <Label>Data de Validade</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowExpiryCalendar(!showExpiryCalendar);
                      setShowEntryCalendar(false);
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiryDate
                      ? formatDate(new Date(formData.expiryDate))
                      : "Selecione uma data"}
                  </Button>
                  {showExpiryCalendar &&
                    generateCalendar(
                      expiryDate || new Date(),
                      setExpiryDate,
                      () => setShowExpiryCalendar(false)
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora de Entrada no Lab</Label>
                    <TimePicker
                      value={formData.labEntryTime}
                      onChange={(value) => handleInputChange("labEntryTime", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hora de Armazenamento</Label>
                    <TimePicker
                      value={formData.freezerStorageTime}
                      onChange={(value) => handleInputChange("freezerStorageTime", value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Notas adicionais sobre a amostra..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage Location */}
            <Card>
              <CardHeader>
                <CardTitle>Local de Armazenamento</CardTitle>
                <CardDescription>
                  Atualize o local de armazenamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentId">Equipamento *</Label>
                  <Select
                    value={
                      formData.equipmentId
                        ? `${formData.equipmentCode}:${formData.equipmentId}:${formData.equipmentType}`
                        : ""
                    }
                    onValueChange={handleEquipmentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentList.length > 0 ? (
                        equipmentList.map((item) => (
                          <SelectItem
                            key={item._id}
                            value={`${item.code}:${item._id}:${item.type}`}
                          >
                            {item.code} - {item.name} ({EQUIPMENT_TYPES[item.type]?.label || item.type})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="na" disabled>
                          Nenhum equipamento disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {typeConfig.levels.map((level) => (
                    <div key={level.key} className="space-y-2">
                      <Label htmlFor={level.key}>{level.label} *</Label>
                      {level.kind === "select" ? (
                        <Select
                          value={formData.levelValues[level.key] || ""}
                          onValueChange={(value) => handleLevelChange(level.key, level.prefix, "select", value)}
                        >
                          <SelectTrigger id={level.key}>
                            <SelectValue placeholder={level.options?.join(" ou ")} />
                          </SelectTrigger>
                          <SelectContent>
                            {level.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={level.key}
                          type="number"
                          value={(formData.levelValues[level.key] || "").replace(level.prefix, "")}
                          onChange={(e) => handleLevelChange(level.key, level.prefix, "number", e.target.value)}
                          placeholder={level.label}
                          min="1"
                        />
                      )}
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label htmlFor="positionCount">Nr. posições</Label>
                    <Input
                      id="positionCount"
                      type="number"
                      min="1"
                      value={formData.positionCount}
                      onChange={(e) => handlePositionCountChange(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 shadow-xs text-card-foreground ${
                    occupiedConflicts.length > 0
                      ? "border border-destructive/40 bg-destructive/5"
                      : locationComplete
                        ? "border border-primary/30 bg-primary/5"
                        : "border border-amber-600/30 bg-amber-50/25"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">
                      Visualização da Localização:
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Legenda dos códigos de localização</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 text-sm">
                        <p className="font-medium mb-2">
                          Legenda dos códigos de localização ({typeConfig.label})
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{typeConfig.prefix}1</span>
                            <span className="text-muted-foreground">{typeConfig.label} 1</span>
                          </div>
                          {typeConfig.levels.map((level) => (
                            <div key={level.key} className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                {level.kind === "select" ? level.options?.[0] : `${level.prefix}1`}
                              </span>
                              <span className="text-muted-foreground">{level.label} 1</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">P1</span>
                            <span className="text-muted-foreground">Posição 1</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Exemplo: {legendExample}
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm mt-1">
                    {occupiedConflicts.length > 0 ? (
                      <span className="text-destructive font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Posições ocupadas: {occupiedConflicts.map((c) => `P${c.position} (${c.patientCode})`).join(", ")}
                      </span>
                    ) : (
                      <span
                        className={
                          locationComplete
                            ? "text-primary font-semibold"
                            : "text-amber-600 font-medium"
                        }
                      >
                        {locationPreview || "Complete all fields to see location"}
                      </span>
                    )}
                  </p>
                </div>

                <div className="min-h-[28rem]">
                  {formData.equipmentId && pathComplete ? (
                    boxConfigLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-[26rem] w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>
                            Posições{typeConfig.positionLayout === "grid" ? " na Caixa" : ""} (
                            {typeConfig.positionLayout === "grid" ? `${boxRows}x${boxColumns}` : boxColumns})
                          </Label>
                          {!editingBoxDimensions && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => setEditingBoxDimensions(true)}
                            >
                              {boxConfig ? "Alterar dimensões" : "Definir dimensões"}
                            </Button>
                          )}
                        </div>

                        {editingBoxDimensions ? (
                          <BoxDimensionsEditor
                            initialRows={boxRows}
                            initialColumns={boxColumns}
                            onSave={handleSaveBoxDimensions}
                            onCancel={() => setEditingBoxDimensions(false)}
                            saving={savingBoxDimensions}
                            layout={typeConfig.positionLayout}
                          />
                        ) : (
                          <>
                            <PositionPicker
                              occupied={occupiedInCurrentBox}
                              selected={formData.selectedPositions}
                              onSelect={handleSelectPosition}
                              maxPosition={boxRows * boxColumns}
                              columns={boxColumns}
                              layout={typeConfig.positionLayout}
                            />
                            {formData.selectedPositions.length > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">
                                  Seleccionadas: {formatPositions(formData.selectedPositions)}
                                </span>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0"
                                  onClick={() =>
                                    setFormData((prev) => ({ ...prev, selectedPositions: [], positionCount: "1" }))
                                  }
                                >
                                  Limpar selecção
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Seleccione o equipamento e preencha os campos de localização para ver as posições ocupadas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/samples">
              <Button variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={loading || sampleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Atualizar Amostra
                </>
              )}
            </Button>
          </div>
      </form>
    </div>
  );
}
