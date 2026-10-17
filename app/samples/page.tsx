"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { buildLocationCode } from "@/lib/equipment-types";
import { getPageNumbers } from "@/lib/utils";

interface Sample {
  _id: string;
  patientCode: string;
  sampleType: string;
  sampleQuantity: string;
  project: string;
  equipmentId: string;
  equipmentCode: string;
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
}

interface EquipmentOption {
  _id: string;
  code: string;
  name: string;
}

export default function SamplesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmDialog = useConfirm();

  const [samples, setSamples] = useState<Sample[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado inicializado directamente a partir do URL (inicializador lazy
  // do useState), em vez de um useEffect separado a correr depois do
  // primeiro render. Com um efeito, há uma corrida: no primeiro render
  // o estado arranca sempre nos valores por defeito (ex. currentPage=1),
  // e o efeito que escreve o estado para o URL (updateURL) pode correr
  // com esse valor desactualizado ANTES do efeito que lê o URL ter
  // oportunidade de corrigir o estado — reescrevendo o URL de volta para
  // "/samples" sem os parâmetros, mesmo vindo de um link com "?page=4"
  // correcto. Lazy initializer lê o URL uma única vez, de forma
  // síncrona, antes de qualquer efeito correr — sem corrida possível.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [filterType, setFilterType] = useState(() => searchParams.get("type") || "all");
  const [filterProject, setFilterProject] = useState(() => searchParams.get("project") || "all");
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(() => {
    const equipment = searchParams.get("equipment");
    // Aceita tanto o formato antigo "id:nome" (links antigos guardados)
    // como o id simples usado actualmente.
    return equipment ? equipment.split(":")[0] : null;
  });
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? Number.parseInt(page, 10) || 1 : 1;
  });
  const itemsPerPage = 10;

  // Filter samples based on search, filters, and freezer
  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.sampleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.project.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || sample.sampleType === filterType;
    const matchesProject =
      filterProject === "all" || sample.project === filterProject;
    const matchesEquipment =
      !equipmentFilter || sample.equipmentId === equipmentFilter;
    const matchesPending =
      !showPendingOnly || !sample.positions || sample.positions.length === 0;

    return matchesSearch && matchesType && matchesProject && matchesEquipment && matchesPending;
  });

  const pendingCount = samples.filter(
    (sample) => !sample.positions || sample.positions.length === 0
  ).length;

  // Calculate total pages
  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Get current samples for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSamples = filteredSamples.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Update URL with current filters and pagination
  const updateURL = (page: number) => {
    const params = new URLSearchParams();

    if (page > 1) {
      params.set("page", page.toString());
    }
    if (equipmentFilter) {
      params.set("equipment", equipmentFilter);
    }
    if (filterType !== "all") {
      params.set("type", filterType);
    }
    if (filterProject !== "all") {
      params.set("project", filterProject);
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }

    const queryString = params.toString();
    const url = queryString ? `/samples?${queryString}` : "/samples";

    // Actualiza o URL (sem criar uma entrada nova no histórico a cada
    // mudança de página/filtro) através do router do Next.js — usar
    // window.history.pushState directamente deixa o router do Next.js
    // sem saber destes URLs, e por isso router.back() (ex. ao sair de
    // "editar amostra") não voltava à página/filtro certos.
    router.replace(url, { scroll: false });
  };

  // Change page function
  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    updateURL(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update URL when filters/page change
  useEffect(() => {
    updateURL(currentPage);
  }, [searchTerm, filterType, filterProject, equipmentFilter, currentPage]);

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return expiry <= thirtyDaysFromNow;
  };

  const handleDeleteSample = async (sample: Sample) => {
    const confirmed = await confirmDialog({
      title: "Eliminar amostra?",
      description: `Tem a certeza que quer eliminar a amostra ${sample.patientCode}? Esta acção não pode ser revertida.`,
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/samples/${sample._id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Amostra eliminada com sucesso");
        fetchSamples();
      } else {
        toast.error("Falha ao eliminar a amostra");
      }
    } catch (error) {
      console.error("Error deleting sample:", error);
      toast.error("Falha ao eliminar a amostra");
    }
  };

  const clearEquipmentFilter = () => {
    setEquipmentFilter(null);
    setCurrentPage(1);
  };

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipmentList.find((eq) => eq._id === equipmentId);
    return equipment ? `${equipment.code} - ${equipment.name}` : "Equipamento desconhecido";
  };

  // Handle search and filter changes — cada mudança de filtro volta à
  // página 1 (feito aqui, no momento da mudança, em vez de num useEffect
  // separado: um efeito com estas dependências também corre no primeiro
  // render, antes do estado inicializado a partir do URL ter hipótese de
  // "assentar", e reescrevia a página de volta para 1 logo ao montar).
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleProjectChange = (value: string) => {
    setFilterProject(value);
    setCurrentPage(1);
  };

  const handleEquipmentFilterChange = (value: string) => {
    setEquipmentFilter(value === "all" ? null : value);
    setCurrentPage(1);
  };

  const fetchSamples = async () => {
    try {
      const response = await fetch("/api/samples");
      if (response.ok) {
        const data = await response.json();
        setSamples(data);
        console.log(data);
      }
    } catch (error) {
      toast.error("Falha ao buscar amostras");
      console.log("Error fetching samples:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentList = async () => {
    try {
      const response = await fetch("/api/equipment");
      if (response.ok) {
        setEquipmentList(await response.json());
      }
    } catch (error) {
      console.log("Error fetching equipment:", error);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchEquipmentList();
  }, []);

  // Passado explicitamente para "ver"/"editar", em vez de confiar no
  // histórico do browser (router.back()) — assim "voltar" chega sempre
  // exactamente a esta página/filtro, sem depender de cache do Next.js.
  const currentListQuery = searchParams.toString();
  const returnTo = encodeURIComponent(
    currentListQuery ? `/samples?${currentListQuery}` : "/samples"
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Amostras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquisar, filtrar e gerenciar amostras de laboratório
          </p>
          {equipmentFilter && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                Filtrado por: {getEquipmentName(equipmentFilter)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearEquipmentFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPendingOnly((prev) => !prev)}
              className="mt-2"
              title="Amostras que ficaram sem posição atribuída durante a migração de dados"
            >
              <Badge
                variant={showPendingOnly ? "default" : "destructive"}
                className="flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                {showPendingOnly
                  ? `A mostrar só pendentes (${pendingCount}) — clique para limpar`
                  : `${pendingCount} amostra(s) com posição pendente`}
              </Badge>
            </button>
          )}
        </div>
        <Link href={`/samples/add?from=${returnTo}`}>
          <Button className="gap-2">Adicionar Nova Amostra</Button>
        </Link>
      </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pesquisar e Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Pesquisar por código do paciente, tipo de amostra ou projecto…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={equipmentFilter || "all"} onValueChange={handleEquipmentFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Equipamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Equipamentos</SelectItem>
                  {equipmentList.map((equipment) => (
                    <SelectItem key={equipment._id} value={equipment._id}>
                      {equipment.code} - {equipment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Amostra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Lavado brocoaveolar">
                    Lavado brocoaveolar
                  </SelectItem>
                  <SelectItem value="Blood Serum">Soro Sanguíneo</SelectItem>
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
                </SelectContent>
              </Select>
              <Select value={filterProject} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Projecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Projectos</SelectItem>
                  <SelectItem value="PCP-PED">PCP-PED</SelectItem>
                  <SelectItem value="COVID-19 Study">
                    Estudo sobre COVID-19
                  </SelectItem>
                  <SelectItem value="Diabetes Research">
                    Pesquisa sobre Diabetes
                  </SelectItem>
                  <SelectItem value="Genetic Analysis">
                    Análise Genética
                  </SelectItem>
                  <SelectItem value="Cancer Research">
                    Pesquisa sobre Câncer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados da Amostra ({filteredSamples.length})
              {equipmentFilter && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  em {getEquipmentName(equipmentFilter)}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Clique em uma amostra para ver detalhes ou gerenciar
              {totalPages > 1 && (
                <span className="ml-2">
                  • Página {currentPage} de {totalPages}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando amostras...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {currentSamples.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {equipmentFilter
                        ? `Nenhuma amostra encontrada em ${getEquipmentName(
                            equipmentFilter
                          )}`
                        : "Nenhuma amostra encontrada que corresponda aos seus critérios"}
                    </p>
                  </div>
                ) : (
                  currentSamples.map((sample) => (
                    <div
                      key={sample._id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={`/samples/${sample._id}`}
                              className="font-semibold text-lg hover:text-primary hover:underline"
                            >
                              {sample.patientCode}
                            </Link>
                            <Badge variant="secondary">
                              {sample.sampleType}
                            </Badge>
                            {isExpiringSoon(sample.expiryDate) && (
                              <Badge variant="destructive">
                                A Expirar em Breve
                              </Badge>
                            )}
                            {(!sample.positions || sample.positions.length === 0) && (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1"
                                title="Esta amostra ficou sem posição atribuída durante a migração de dados — precisa de resolução manual."
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Posição pendente{sample.position ? ` (pretendia ${sample.position})` : ""}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p>
                                <span className="font-medium">Projecto:</span>{" "}
                                {sample.project}
                              </p>
                              <p>
                                <span className="font-medium">Quantidade:</span>{" "}
                                {sample.sampleQuantity
                                  ? sample.sampleQuantity + " mL"
                                  : "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  Localização:
                                </span>{" "}
                                {sample.positions && sample.positions.length > 0 ? (
                                  buildLocationCode(sample.equipmentCode, sample.path || [], sample.positions)
                                ) : (
                                  <span className="text-destructive font-medium">
                                    Por atribuir
                                    {sample.position && ` (pretendia ${buildLocationCode(sample.equipmentCode, sample.path || [])}-${sample.position})`}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span className="font-medium">
                                  Data de Entrada:
                                </span>{" "}
                                {sample.entryDate}
                              </p>
                              <p>
                                <span className="font-medium">Hora Lab:</span>{" "}
                                {sample.labEntryTime || "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  Data de Validade:
                                </span>{" "}
                                {sample.expiryDate}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span className="font-medium">
                                  Hora de Armazenamento:
                                </span>{" "}
                                {sample.freezerStorageTime || "N/A"}
                              </p>
                            </div>
                          </div>
                          {sample.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium">Observações:</span>{" "}
                              {sample.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/samples/${sample._id}?from=${returnTo}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/samples/edit/${sample._id}?from=${returnTo}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSample(sample)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>

                      {pageNumbers.map((page, index) =>
                        page === "ellipsis" ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => changePage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
