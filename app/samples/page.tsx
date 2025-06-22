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


interface Sample {
  _id: string
  patientCode: string
  sampleType: string
  project: string
  freezerId: string
  freezerCode: string
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

  const [samples, setSamples] = useState<Sample[]>([])
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
    const matchesFreezer = !freezerFilter || sample.freezerId === freezerFilter.split(":")[0]

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
      // Call API to delete sample
      try {
        fetch(`/api/samples/${sample._id}`, {
          method: "DELETE",
        }).then((response) => {
          if (response.ok) {
            alert("Sample deleted successfully")
            // Refresh samples
            fetchSamples()
          } else {
            alert("Failed to delete sample")
          }
        })
      } catch (error) {
        console.error("Error deleting sample:", error)
        alert("Failed to delete sample")
      }
    }
  }

  const clearFreezerFilter = () => {
    setFreezerFilter(null)
  }

  const getFreezerName = (freezerId: string) => {
    return freezerId ? freezerId.split(":")[1] || "Unknown Freezer" : "All Freezers"
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

  const fetchSamples = async () => {
    try {
      const response = await fetch("/api/samples")
      if (response.ok) {
        const data = await response.json()
        setSamples(data)
        console.log(data);
      }
    } catch (error) {
      alert("Falha ao buscar amostras")
      console.log("Error fetching samples:", error)
    } finally {
      // setLoading(false)
    }
  }

  useEffect(() => {
    fetchSamples();
  }, []);

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
                  <SelectItem value="Lavado brocoaveolar">Lavado brocoaveolar</SelectItem>
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
                  <SelectItem value="PCP-PED">PCP-PED</SelectItem>
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
                    <div key={sample._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                                <span className="font-medium">Localização:</span> {sample.freezerCode}-{sample.shelf}-
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
                                `Detalhes da Amostra:\nCódigo do Paciente: ${sample.patientCode}\nTipo de Amostra: ${sample.sampleType}\nProjecto: ${sample.project}\nLocalização: ${sample.freezerCode}-${sample.shelf}-${sample.box}-${sample.position}\nData de Entrada: ${sample.entryDate}\nData de Validade: ${sample.expiryDate}\nObservações: ${sample.notes}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/samples/edit/${sample._id}`}>
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
