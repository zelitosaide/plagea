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
import { cn } from "@/lib/utils";
import { PositionPicker } from "@/components/position-picker";
import { TimePicker } from "@/components/time-picker";
import { BoxDimensionsEditor } from "@/components/box-dimensions-editor";

type Freezer = {
  _id: string;
  code: string;
  name: string;
  location: string;
  temperature: string;
  capacity: number;
  currentSamples: number;
  status: "operational" | "maintenance" | "offline";
  lastMaintenance: string;
};

type BoxConfig = {
  rows: number;
  columns: number;
};

type ExistingSample = {
  _id: string;
  patientCode: string;
  shelf: string;
  rightLeft: string;
  box: string;
  position: string;
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
    freezerId: "",
    freezerCode: "",
    shelf: "",
    box: "",
    rightLeft: "",
    position: "",
    notes: "",
    entryDate: "",
    expiryDate: "",
    labEntryTime: "",
    freezerStorageTime: "",
  });

  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date>();

  const [freezers, setFreezers] = useState<Freezer[]>([]);
  const [customSampleTypes, setCustomSampleTypes] = useState<string[]>([]);
  const [freezerSamples, setFreezerSamples] = useState<ExistingSample[]>([]);
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [boxConfigLoading, setBoxConfigLoading] = useState(false);
  const [editingBoxDimensions, setEditingBoxDimensions] = useState(false);
  const [savingBoxDimensions, setSavingBoxDimensions] = useState(false);

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
        ];

        // Also check if it's in the loaded custom types
        const isInCustomTypes = customSampleTypes.includes(data.sampleType);
        const isInPredefinedTypes = predefinedTypes.includes(data.sampleType);

        if (data.sampleType && !isInPredefinedTypes && !isInCustomTypes) {
          // It's a custom type that's not in our current custom types list
          // This can happen if the type was removed from settings but still exists in samples
          setFormData({
            ...data,
            sampleType: "custom",
            customSampleType: data.sampleType,
          });
        } else if (isInCustomTypes) {
          // It's a known custom type
          setFormData({
            ...data,
            sampleType: data.sampleType, // Keep it as the custom type value
            customSampleType: "", // Clear this since it's not "custom" selector
          });
        } else {
          // It's a predefined type
          setFormData(data);
        }

        // Sincroniza os objectos Date usados pelo calendário e pela
        // validação de envio — setFormData só preenche as strings usadas
        // para mostrar o texto no botão.
        if (data.entryDate) setEntryDate(new Date(data.entryDate));
        if (data.expiryDate) setExpiryDate(new Date(data.expiryDate));

        console.log(data);
      }
    } catch (error) {
      alert("Falha ao buscar a amostra");
      console.log("Error fetching sample:", error);
    } finally {
      // setLoading(false)
    }
  };

  const fetchFreezers = async () => {
    try {
      const response = await fetch("/api/freezers");
      if (response.ok) {
        const data = await response.json();
        setFreezers(data);
        console.log(data);
      }
    } catch (error) {
      alert("Falha ao buscar congeladores");
      console.log("Error fetching freezers:", error);
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
        await Promise.all([fetchFreezers(), loadCustomSampleTypes()]);
        // Load sample data after custom types are loaded
        await fetchSampleById();
      } finally {
        setSampleLoading(false);
      }
    };

    initializeData();
  }, [id]);

  // Carrega as amostras já guardadas no congelador seleccionado, para
  // mostrar quais posições estão ocupadas/livres (excluindo esta própria
  // amostra, que já ocupa uma posição).
  useEffect(() => {
    if (!formData.freezerId) {
      setFreezerSamples([]);
      return;
    }

    fetch(`/api/samples?freezerId=${formData.freezerId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((samples: ExistingSample[]) =>
        setFreezerSamples(samples.filter((sample) => sample._id !== id))
      )
      .catch(() => setFreezerSamples([]));
  }, [formData.freezerId, id]);

  // Carrega as dimensões guardadas para esta caixa específica
  // (freezerId+shelf+rightLeft+box). Cada caixa é independente: uma
  // caixa de 9x9 e outra de 10x10 no mesmo congelador são normais.
  useEffect(() => {
    setEditingBoxDimensions(false);

    if (!formData.freezerId || !formData.shelf || !formData.rightLeft || !formData.box) {
      setBoxConfig(null);
      setBoxConfigLoading(false);
      return;
    }

    const params = new URLSearchParams({
      freezerId: formData.freezerId,
      shelf: formData.shelf,
      rightLeft: formData.rightLeft,
      box: formData.box,
    });

    setBoxConfigLoading(true);
    fetch(`/api/boxes?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setBoxConfig(data ? { rows: data.rows, columns: data.columns } : null))
      .catch(() => setBoxConfig(null))
      .finally(() => setBoxConfigLoading(false));
  }, [formData.freezerId, formData.shelf, formData.rightLeft, formData.box]);

  const handleSaveBoxDimensions = async (rows: number, columns: number) => {
    setSavingBoxDimensions(true);
    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freezerId: formData.freezerId,
          shelf: formData.shelf,
          rightLeft: formData.rightLeft,
          box: formData.box,
          rows,
          columns,
        }),
      });

      if (response.ok) {
        setBoxConfig({ rows, columns });
        setEditingBoxDimensions(false);
      } else {
        alert("Falha ao guardar as dimensões da caixa");
      }
    } catch (error) {
      console.error("Error saving box dimensions:", error);
      alert("Falha ao guardar as dimensões da caixa");
    } finally {
      setSavingBoxDimensions(false);
    }
  };

  const occupiedInCurrentBox =
    formData.shelf && formData.rightLeft && formData.box
      ? freezerSamples
          .filter(
            (sample) =>
              sample.shelf === formData.shelf &&
              sample.rightLeft === formData.rightLeft &&
              sample.box === formData.box
          )
          .map((sample) => ({
            position: Number.parseInt(sample.position.replace("P", ""), 10),
            patientCode: sample.patientCode,
          }))
          .filter((slot) => !Number.isNaN(slot.position))
      : [];

  const boxRows = boxConfig?.rows || 9;
  const boxColumns = boxConfig?.columns || 9;

  const selectedPositionNumber = formData.position
    ? Number.parseInt(formData.position.replace("P", ""), 10)
    : undefined;

  const occupiedSlotMatch = occupiedInCurrentBox.find(
    (slot) => slot.position === selectedPositionNumber
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (occupiedSlotMatch) {
      alert(
        `Esta posição já está ocupada pela amostra do paciente ${occupiedSlotMatch.patientCode}. Escolha outra posição.`
      );
      return;
    }

    // Determine the final sample type to use
    const finalSampleType =
      formData.sampleType === "custom"
        ? formData.customSampleType
        : formData.sampleType;

    if (!entryDate || !expiryDate) {
      alert("Please select both entry and expiry dates");
      return;
    }

    // Validate sample quantity specifically
    if (!formData.sampleQuantity || parseFloat(formData.sampleQuantity) <= 0) {
      alert("Por favor, insira uma quantidade válida da amostra (maior que 0)");
      return;
    }

    // Validate time fields
    if (!formData.labEntryTime) {
      alert("Por favor, insira a hora de entrada no laboratório");
      return;
    }

    if (!formData.freezerStorageTime) {
      alert("Por favor, insira a hora de armazenamento no congelador");
      return;
    }

    setLoading(true);

    try {
      await fetch(`/api/samples/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sampleType: finalSampleType,
          entryDate: entryDate.toISOString().split("T")[0],
          expiryDate: expiryDate?.toISOString().split("T")[0],
        }),
      });

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

      alert("Sample updated successfully!");
      router.push("/samples");
    } catch (error) {
      console.error("Error updating sample:", error);
      alert("Failed to update sample");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "freezerId") {
      const [code, id] = value.split(":");
      setFormData((prev) => ({
        ...prev,
        freezerId: id,
        freezerCode: code,
      }));
    } else if (field === "sampleType") {
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
    const lastDay = new Date(year, month + 1, 0);
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
      <div className="flex items-center gap-4">
        <Link href="/samples">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Amostras
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar Amostra</h1>
      </div>

      <form onSubmit={handleSubmit}>
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
                  <Label>Data de Validade *</Label>
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
                    <Label>Hora de Entrada no Lab *</Label>
                    <TimePicker
                      value={formData.labEntryTime}
                      onChange={(value) => handleInputChange("labEntryTime", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hora de Armazenamento *</Label>
                    <TimePicker
                      value={formData.freezerStorageTime}
                      onChange={(value) => handleInputChange("freezerStorageTime", value)}
                    />
                  </div>
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
                  <Label htmlFor="freezerId">ID do Congelador *</Label>
                  <Select
                    value={
                      formData.freezerId
                        ? `${formData.freezerCode}:${formData.freezerId}`
                        : ""
                    }
                    onValueChange={(value) =>
                      handleInputChange("freezerId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o congelador" />
                    </SelectTrigger>
                    <SelectContent>
                      {freezers.length > 0 ? (
                        freezers.map((freezer) => (
                          <SelectItem
                            key={freezer._id}
                            value={`${freezer.code}:${freezer._id}`}
                          >
                            {freezer.code} - {freezer.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="na" disabled>
                          Nenhum congelador disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shelf">Prateleira *</Label>
                    <Input
                      id="shelf"
                      type="number"
                      value={formData.shelf.toString().replace("S", "")}
                      onChange={(e) =>
                        handleInputChange("shelf", `S${e.target.value}`)
                      }
                      placeholder="Prateleira"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rightLeft">Lado *</Label>
                    <Select
                      value={formData.rightLeft}
                      onValueChange={(value) =>
                        handleInputChange("rightLeft", value)
                      }
                    >
                      <SelectTrigger id="rightLeft">
                        <SelectValue placeholder="D ou E" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="box">Box *</Label>
                    <Input
                      id="box"
                      type="number"
                      value={formData.box.toString().replace("B", "")}
                      onChange={(e) =>
                        handleInputChange("box", `B${e.target.value}`)
                      }
                      placeholder="Box"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Posição *</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position.toString().replace("P", "")}
                      onChange={(e) =>
                        handleInputChange("position", `P${e.target.value}`)
                      }
                      placeholder="Posição"
                      min="1"
                      aria-invalid={!!occupiedSlotMatch}
                      className={occupiedSlotMatch ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {occupiedSlotMatch && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Posição já ocupada por {occupiedSlotMatch.patientCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-h-72">
                  {formData.freezerId && formData.shelf && formData.rightLeft && formData.box ? (
                    boxConfigLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-56 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>
                            Posições na Caixa ({boxRows}x{boxColumns})
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
                          />
                        ) : (
                          <PositionPicker
                            occupied={occupiedInCurrentBox}
                            selected={selectedPositionNumber}
                            onSelect={(pos) => handleInputChange("position", `P${pos}`)}
                            maxPosition={boxRows * boxColumns}
                            columns={boxColumns}
                          />
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Seleccione o congelador, a prateleira, o lado e a box para ver as posições ocupadas.
                    </p>
                  )}
                </div>

                <div
                  className={`rounded-lg p-4 shadow-xs text-card-foreground ${
                    occupiedSlotMatch
                      ? "border border-destructive/40 bg-destructive/5"
                      : formData.freezerId &&
                          formData.shelf &&
                          formData.rightLeft &&
                          formData.box &&
                          formData.position
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
                        <p className="font-medium mb-2">Legenda dos códigos de localização</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">F5</span>
                            <span className="text-muted-foreground">Congelador 5</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">S1</span>
                            <span className="text-muted-foreground">Prateleira 1</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">B1</span>
                            <span className="text-muted-foreground">Box 1</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">P1</span>
                            <span className="text-muted-foreground">Posição 1</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Exemplo: F5-S1-D-B1-P1 = Congelador 5, Prateleira 1, Direita, Box 1, Posição 1
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm mt-1">
                    {occupiedSlotMatch ? (
                      <span className="text-destructive font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Posição ocupada por {occupiedSlotMatch.patientCode}
                      </span>
                    ) : (
                      <span
                        className={
                          formData.freezerId &&
                          formData.shelf &&
                          formData.rightLeft &&
                          formData.box &&
                          formData.position
                            ? "text-primary font-semibold"
                            : "text-amber-600 font-medium"
                        }
                      >
                        {formData.freezerId &&
                        formData.shelf &&
                        formData.rightLeft &&
                        formData.box &&
                        formData.position
                          ? `${
                              freezers.find((f) => f._id === formData.freezerId)
                                ?.code || ""
                            }-${formData.shelf}-${formData.rightLeft}-${
                              formData.box
                            }-${formData.position}`
                          : "Complete all fields to see location"}
                      </span>
                    )}
                  </p>
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
