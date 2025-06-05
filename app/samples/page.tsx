"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Edit, Trash2, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { 
  // useRouter,
  useSearchParams
} from "next/navigation"

// Mock data for samples
const mockSampleData = [
  {
    id: "1",
    patientCode: "PT-2024-001",
    sampleType: "Blood Serum",
    project: "COVID-19 Study",
    freezerId: "F1",
    shelf: "S2",
    box: "B3",
    position: "P15",
    entryDate: "2024-01-15",
    expiryDate: "2024-07-15",
    notes: "High priority sample",
  },
  {
    id: "2",
    patientCode: "PT-2024-002",
    sampleType: "Plasma",
    project: "Diabetes Research",
    freezerId: "F2",
    shelf: "S1",
    box: "B1",
    position: "P8",
    entryDate: "2024-01-14",
    expiryDate: "2024-06-14",
    notes: "Control sample",
  },
  {
    id: "3",
    patientCode: "PT-2024-003",
    sampleType: "DNA",
    project: "Genetic Analysis",
    freezerId: "F1",
    shelf: "S1",
    box: "B2",
    position: "P5",
    entryDate: "2024-01-13",
    expiryDate: "2025-01-13",
    notes: "Long-term storage",
  },
  {
    id: "4",
    patientCode: "PT-2024-004",
    sampleType: "RNA",
    project: "Genetic Analysis",
    freezerId: "F3",
    shelf: "S3",
    box: "B1",
    position: "P12",
    entryDate: "2024-01-12",
    expiryDate: "2024-08-12",
    notes: "Research sample",
  },
  {
    id: "5",
    patientCode: "PT-2024-005",
    sampleType: "Tissue",
    project: "Cancer Research",
    freezerId: "F4",
    shelf: "S1",
    box: "B5",
    position: "P3",
    entryDate: "2024-01-11",
    expiryDate: "2025-01-11",
    notes: "Biopsy sample",
  },
  {
    id: "6",
    patientCode: "PT-2024-006",
    sampleType: "Blood Serum",
    project: "COVID-19 Study",
    freezerId: "F1",
    shelf: "S2",
    box: "B4",
    position: "P7",
    entryDate: "2024-01-10",
    expiryDate: "2024-07-10",
    notes: "Patient follow-up sample",
  },
  {
    id: "7",
    patientCode: "PT-2024-007",
    sampleType: "Plasma",
    project: "Cardiovascular Study",
    freezerId: "F2",
    shelf: "S2",
    box: "B2",
    position: "P14",
    entryDate: "2024-01-09",
    expiryDate: "2024-06-09",
    notes: "Pre-treatment sample",
  },
  {
    id: "8",
    patientCode: "PT-2024-008",
    sampleType: "DNA",
    project: "Genetic Analysis",
    freezerId: "F3",
    shelf: "S1",
    box: "B3",
    position: "P9",
    entryDate: "2024-01-08",
    expiryDate: "2025-01-08",
    notes: "Family study participant",
  },
  {
    id: "9",
    patientCode: "PT-2024-009",
    sampleType: "RNA",
    project: "Cancer Research",
    freezerId: "F4",
    shelf: "S2",
    box: "B1",
    position: "P18",
    entryDate: "2024-01-07",
    expiryDate: "2024-08-07",
    notes: "Tumor sample",
  },
  {
    id: "10",
    patientCode: "PT-2024-010",
    sampleType: "Tissue",
    project: "Cancer Research",
    freezerId: "F1",
    shelf: "S3",
    box: "B2",
    position: "P11",
    entryDate: "2024-01-06",
    expiryDate: "2025-01-06",
    notes: "Normal tissue control",
  },
  {
    id: "11",
    patientCode: "PT-2024-011",
    sampleType: "Blood Serum",
    project: "Diabetes Research",
    freezerId: "F2",
    shelf: "S1",
    box: "B3",
    position: "P22",
    entryDate: "2024-01-05",
    expiryDate: "2024-07-05",
    notes: "Baseline measurement",
  },
  {
    id: "12",
    patientCode: "PT-2024-012",
    sampleType: "Plasma",
    project: "COVID-19 Study",
    freezerId: "F3",
    shelf: "S2",
    box: "B4",
    position: "P6",
    entryDate: "2024-01-04",
    expiryDate: "2024-06-04",
    notes: "Convalescent plasma",
  },
  {
    id: "13",
    patientCode: "PT-2024-013",
    sampleType: "DNA",
    project: "Cardiovascular Study",
    freezerId: "F4",
    shelf: "S1",
    box: "B1",
    position: "P25",
    entryDate: "2024-01-03",
    expiryDate: "2025-01-03",
    notes: "Genetic risk assessment",
  },
  {
    id: "14",
    patientCode: "PT-2024-014",
    sampleType: "RNA",
    project: "Genetic Analysis",
    freezerId: "F1",
    shelf: "S2",
    box: "B5",
    position: "P13",
    entryDate: "2024-01-02",
    expiryDate: "2024-08-02",
    notes: "Expression analysis",
  },
  {
    id: "15",
    patientCode: "PT-2024-015",
    sampleType: "Tissue",
    project: "Diabetes Research",
    freezerId: "F2",
    shelf: "S3",
    box: "B1",
    position: "P4",
    entryDate: "2024-01-01",
    expiryDate: "2025-01-01",
    notes: "Pancreatic tissue",
  },
  {
    id: "16",
    patientCode: "PT-2024-016",
    sampleType: "Blood Serum",
    project: "Cancer Research",
    freezerId: "F3",
    shelf: "S1",
    box: "B2",
    position: "P19",
    entryDate: "2023-12-31",
    expiryDate: "2024-06-30",
    notes: "Post-surgery sample",
  },
  {
    id: "17",
    patientCode: "PT-2024-017",
    sampleType: "Plasma",
    project: "Genetic Analysis",
    freezerId: "F4",
    shelf: "S2",
    box: "B3",
    position: "P8",
    entryDate: "2023-12-30",
    expiryDate: "2024-06-29",
    notes: "Rare variant carrier",
  },
  {
    id: "18",
    patientCode: "PT-2024-018",
    sampleType: "DNA",
    project: "COVID-19 Study",
    freezerId: "F1",
    shelf: "S3",
    box: "B4",
    position: "P16",
    entryDate: "2023-12-29",
    expiryDate: "2024-12-29",
    notes: "Long COVID study",
  },
  {
    id: "19",
    patientCode: "PT-2024-019",
    sampleType: "RNA",
    project: "Cardiovascular Study",
    freezerId: "F2",
    shelf: "S1",
    box: "B5",
    position: "P21",
    entryDate: "2023-12-28",
    expiryDate: "2024-07-28",
    notes: "Heart failure patient",
  },
  {
    id: "20",
    patientCode: "PT-2024-020",
    sampleType: "Tissue",
    project: "Cancer Research",
    freezerId: "F3",
    shelf: "S2",
    box: "B1",
    position: "P10",
    entryDate: "2023-12-27",
    expiryDate: "2024-12-27",
    notes: "Metastatic sample",
  },
]

interface Sample {
  id: string
  patientCode: string
  sampleType: string
  project: string
  freezerId: string
  shelf: string
  box: string
  position: string
  entryDate: string
  expiryDate: string
  notes: string
}

export default function SamplesPage() {
  // const router = useRouter()
  const searchParams = useSearchParams()

  const [samples, setSamples] = useState<Sample[]>(mockSampleData)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterProject, setFilterProject] = useState("all")
  const [freezerFilter, setFreezerFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Initialize state from URL parameters
  useEffect(() => {
    const page = searchParams.get("page")
    const freezer = searchParams.get("freezer")
    const type = searchParams.get("type")
    const project = searchParams.get("project")
    const search = searchParams.get("search")

    if (page) {
      setCurrentPage(Number.parseInt(page))
    }
    if (freezer) {
      setFreezerFilter(freezer)
    }
    if (type) {
      setFilterType(type)
    }
    if (project) {
      setFilterProject(project)
    }
    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  // Filter samples based on search, filters, and freezer
  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.sampleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.project.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || sample.sampleType === filterType
    const matchesProject = filterProject === "all" || sample.project === filterProject
    const matchesFreezer = !freezerFilter || sample.freezerId === freezerFilter

    return matchesSearch && matchesType && matchesProject && matchesFreezer
  })

  // Calculate total pages
  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage)

  // Get current samples for the page
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSamples = filteredSamples.slice(indexOfFirstItem, indexOfLastItem)

  // Update URL with current filters and pagination
  const updateURL = (page: number) => {
    const params = new URLSearchParams()

    if (page > 1) {
      params.set("page", page.toString())
    }
    if (freezerFilter) {
      params.set("freezer", freezerFilter)
    }
    if (filterType !== "all") {
      params.set("type", filterType)
    }
    if (filterProject !== "all") {
      params.set("project", filterProject)
    }
    if (searchTerm) {
      params.set("search", searchTerm)
    }

    const queryString = params.toString()
    const url = queryString ? `/samples?${queryString}` : "/samples"

    // Update URL without refreshing the page
    window.history.pushState({}, "", url)
  }

  // Change page function
  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    updateURL(pageNumber)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Update URL when filters change
  useEffect(() => {
    updateURL(currentPage)
  }, [searchTerm, filterType, filterProject, freezerFilter, currentPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterProject, freezerFilter])

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiry <= thirtyDaysFromNow
  }

  const handleDeleteSample = (sample: Sample) => {
    const confirmed = confirm(
      `Are you sure you want to delete sample ${sample.patientCode}?\n\nThis action cannot be undone.`,
    )

    if (confirmed) {
      setSamples((prevSamples) => prevSamples.filter((s) => s.id !== sample.id))
      alert(`Sample ${sample.patientCode} has been deleted successfully.`)
    }
  }

  const clearFreezerFilter = () => {
    setFreezerFilter(null)
  }

  const getFreezerName = (freezerId: string) => {
    const freezerNames: { [key: string]: string } = {
      F1: "Main Lab Freezer",
      F2: "Backup Freezer",
      F3: "Long-term Storage",
      F4: "Research Freezer",
    }
    return freezerNames[freezerId] || freezerId
  }

  // Handle search and filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleTypeChange = (value: string) => {
    setFilterType(value)
  }

  const handleProjectChange = (value: string) => {
    setFilterProject(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Amostras</h1>
              <p className="text-gray-600 mt-2">Pesquisar, filtrar e gerenciar amostras de laboratório</p>
              {freezerFilter && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    Filtrado por: {getFreezerName(freezerFilter)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={clearFreezerFilter}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>
            <Link href="/samples/add">
              <Button>Adicionar Nova Amostra</Button>
            </Link>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Pesquisar por código do paciente, tipo de amostra ou projecto…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Amostra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Blood Serum">Soro Sanguíneo</SelectItem>
                  <SelectItem value="Plasma">Plasma</SelectItem>
                  <SelectItem value="DNA">DNA</SelectItem>
                  <SelectItem value="RNA">RNA</SelectItem>
                  <SelectItem value="Tissue">Tecido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProject} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Projecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Projectos</SelectItem>
                  <SelectItem value="COVID-19 Study">Estudo sobre COVID-19</SelectItem>
                  <SelectItem value="Diabetes Research">Pesquisa sobre Diabetes</SelectItem>
                  <SelectItem value="Genetic Analysis">Análise Genética</SelectItem>
                  <SelectItem value="Cancer Research">Pesquisa sobre Câncer</SelectItem>
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
              {freezerFilter && (
                <span className="text-sm font-normal text-gray-600 ml-2">in {getFreezerName(freezerFilter)}</span>
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
                    <p className="text-gray-500">
                      {freezerFilter
                        ? `Nenhuma amostra encontrada em ${getFreezerName(freezerFilter)}`
                        : "Nenhuma amostra encontrada que corresponda aos seus critérios"}
                    </p>
                  </div>
                ) : (
                  currentSamples.map((sample) => (
                    <div key={sample.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{sample.patientCode}</span>
                            <Badge variant="secondary">{sample.sampleType}</Badge>
                            {isExpiringSoon(sample.expiryDate) && <Badge variant="destructive">A Expirar em Breve</Badge>}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p>
                                <span className="font-medium">Projecto:</span> {sample.project}
                              </p>
                              <p>
                                <span className="font-medium">Localização:</span> {sample.freezerId}-{sample.shelf}-
                                {sample.box}-{sample.position}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span className="font-medium">Data de Entrada:</span> {sample.entryDate}
                              </p>
                              <p>
                                <span className="font-medium">Data de Validade:</span> {sample.expiryDate}
                              </p>
                            </div>
                          </div>
                          {sample.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Observações:</span> {sample.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              alert(
                                `Detalhes da Amostra:\nCódigo do Paciente: ${sample.patientCode}\nTipo de Amostra: ${sample.sampleType}\nProjecto: ${sample.project}\nLocalização: ${sample.freezerId}-${sample.shelf}-${sample.box}-${sample.position}\nData de Entrada: ${sample.entryDate}\nData de Validade: ${sample.expiryDate}\nObservações: ${sample.notes}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/samples/edit/${sample.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteSample(sample)}>
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

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => changePage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}

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
    </div>
  )
}
