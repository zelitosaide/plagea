"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  CalendarClock,
  FlaskConical,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { buildLocationCode, formatPositions, getEquipmentTypeConfig } from "@/lib/equipment-types";

type Sample = {
  _id: string;
  patientCode: string;
  sampleType: string;
  sampleQuantity: string;
  project: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentType: string;
  path: string[];
  positions: number[];
  // Só presente em amostras que ficaram sem `positions` na migração de
  // dados do servidor antigo — a posição que a amostra tentava ocupar.
  position?: string;
  entryDate: string;
  expiryDate: string;
  labEntryTime: string;
  freezerStorageTime: string;
  notes: string;
};

type Equipment = {
  _id: string;
  name: string;
};

function daysBetween(a: string, b: string) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

export default function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmDialog = useConfirm();

  // "from" vem da lista (ver app/samples/page.tsx) com o URL exacto —
  // página/filtro — a que "voltar" deve regressar. Sem isto, cai-se de
  // volta em /samples sem nada, perdendo a página onde se estava.
  const from = searchParams.get("from");
  const backHref = from || "/samples";

  const [sample, setSample] = useState<Sample | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const copyToClipboard = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((current) => (current === which ? null : current)), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Não foi possível copiar automaticamente", { description: text });
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`/api/samples/${id}`);
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error("Falha ao buscar a amostra");
        const data: Sample = await response.json();
        setSample(data);

        if (data.equipmentId) {
          const equipmentResponse = await fetch(`/api/equipment/${data.equipmentId}`);
          if (equipmentResponse.ok) {
            setEquipment(await equipmentResponse.json());
          }
        }
      } catch (error) {
        console.error("Error fetching sample:", error);
        toast.error("Falha ao buscar a amostra");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleDelete = async () => {
    if (!sample) return;
    const confirmed = await confirmDialog({
      title: "Eliminar amostra?",
      description: `Tem a certeza que quer eliminar a amostra ${sample.patientCode}? Esta acção não pode ser revertida.`,
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/samples/${sample._id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Amostra eliminada com sucesso");
      router.push("/samples");
    } else {
      toast.error("Falha ao eliminar a amostra");
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !sample) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Amostras
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Amostra não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const isExpired = !!sample.expiryDate && sample.expiryDate < today;
  const isExpiringSoon = !isExpired && !!sample.expiryDate && daysBetween(sample.expiryDate, today) <= 30;

  const typeConfig = getEquipmentTypeConfig(sample.equipmentType);
  const locationCode = buildLocationCode(sample.equipmentCode, sample.path || [], sample.positions);
  const levelLabels = typeConfig.levels.map((level, index) => ({
    label: level.label,
    value: sample.path?.[index] || "—",
  }));

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Amostras
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {sample.patientCode}
              {isExpired && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" />
                  Expirada
                </Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  A Expirar em Breve
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Detalhes da amostra</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(window.location.href, "link")}
            className="flex items-center gap-2"
          >
            {copied === "link" ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
            {copied === "link" ? "Link copiado!" : "Copiar Link"}
          </Button>
          <Link href={`/samples/edit/${sample._id}${from ? `?from=${encodeURIComponent(from)}` : ""}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Informações da Amostra
            </CardTitle>
            <CardDescription>Dados clínicos e de projecto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo de Amostra</p>
                <p className="font-medium">{sample.sampleType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantidade</p>
                <p className="font-medium">{sample.sampleQuantity ? `${sample.sampleQuantity} mL` : "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Projecto</p>
                <p className="font-medium">{sample.project}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Data de Entrada
                </p>
                <p className="font-medium">{sample.entryDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Data de Validade
                </p>
                <p className={`font-medium ${isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600" : ""}`}>
                  {sample.expiryDate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Hora de Entrada no Lab</p>
                <p className="font-medium">{sample.labEntryTime || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hora de Armazenamento</p>
                <p className="font-medium">{sample.freezerStorageTime || "N/A"}</p>
              </div>
            </div>

            {sample.notes && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{sample.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Local de Armazenamento
            </CardTitle>
            <CardDescription>
              {equipment ? `${sample.equipmentCode} - ${equipment.name}` : sample.equipmentCode} ({typeConfig.label})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sample.positions || sample.positions.length === 0 ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  Esta amostra ficou sem posição atribuída durante a migração de dados do servidor
                  antigo (colidia com outra amostra na mesma posição) — precisa de resolução manual.
                  {sample.position && (
                    <>
                      {" "}
                      Posição pretendida:{" "}
                      <span className="font-mono">
                        {buildLocationCode(sample.equipmentCode, sample.path || [])}-{sample.position}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Código de Localização</p>
                  <p className="text-lg font-semibold text-primary mt-1">{locationCode}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 flex items-center gap-2"
                  onClick={() => copyToClipboard(locationCode, "code")}
                  title="Copiar código de localização (ex.: para colar no REDCap)"
                >
                  {copied === "code" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copied === "code" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {levelLabels.map((item) => (
                <div key={item.label}>
                  <p className="text-muted-foreground">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
              <div>
                <p className="text-muted-foreground">Posições</p>
                <p className="font-medium">
                  {sample.positions && sample.positions.length > 0 ? (
                    formatPositions(sample.positions)
                  ) : (
                    <span className="text-destructive">
                      Por atribuir{sample.position ? ` (pretendia ${sample.position})` : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
