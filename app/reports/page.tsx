"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Download, Calendar, TrendingUp, AlertTriangle, Package } from "lucide-react"

// Mock data for reports
const mockReportData = {
  totalSamples: 1247,
  samplesByType: [
    { type: "Blood Serum", count: 456, percentage: 37 },
    { type: "Plasma", count: 312, percentage: 25 },
    { type: "DNA", count: 234, percentage: 19 },
    { type: "RNA", count: 156, percentage: 12 },
    { type: "Tissue", count: 89, percentage: 7 },
  ],
  samplesByProject: [
    { project: "COVID-19 Study", count: 387, percentage: 31 },
    { project: "Diabetes Research", count: 298, percentage: 24 },
    { project: "Genetic Analysis", count: 234, percentage: 19 },
    { project: "Cancer Research", count: 189, percentage: 15 },
    { project: "Cardiovascular Study", count: 139, percentage: 11 },
  ],
  expiringSamples: [
    { patientCode: "PT-2024-001", sampleType: "Blood Serum", expiryDate: "2024-02-15", daysLeft: 5 },
    { patientCode: "PT-2024-007", sampleType: "Plasma", expiryDate: "2024-02-18", daysLeft: 8 },
    { patientCode: "PT-2024-012", sampleType: "DNA", expiryDate: "2024-02-22", daysLeft: 12 },
  ],
  freezerUtilization: [
    { id: "F1", name: "Main Lab Freezer", utilization: 77 },
    { id: "F2", name: "Backup Freezer", utilization: 52 },
    { id: "F3", name: "Long-term Storage", utilization: 23 },
    { id: "F4", name: "Research Freezer", utilization: 75 },
  ],
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive overview of laboratory sample data and trends</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockReportData.totalSamples.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockReportData.samplesByProject.length}</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{mockReportData.expiringSamples.length}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  mockReportData.freezerUtilization.reduce((sum, f) => sum + f.utilization, 0) /
                    mockReportData.freezerUtilization.length,
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Freezer capacity</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Samples by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Samples by Type</CardTitle>
              <CardDescription>Distribution of sample types in the laboratory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.samplesByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-sm font-medium">{item.count} samples</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percentage} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-8">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Samples by Project */}
          <Card>
            <CardHeader>
              <CardTitle>Samples by Project</CardTitle>
              <CardDescription>Sample distribution across research projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.samplesByProject.map((item) => (
                  <div key={item.project} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">{item.project}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.count}</span>
                      <Progress value={item.percentage} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-8">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Expiring Samples
              </CardTitle>
              <CardDescription>Samples requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockReportData.expiringSamples.map((sample) => (
                  <div key={sample.patientCode} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{sample.patientCode}</div>
                      <div className="text-sm text-gray-600">{sample.sampleType}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-600">{sample.daysLeft} days left</div>
                      <div className="text-xs text-gray-500">{sample.expiryDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Freezer Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Freezer Utilization</CardTitle>
              <CardDescription>Current capacity usage across all freezers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.freezerUtilization.map((freezer) => (
                  <div key={freezer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{freezer.name}</span>
                      <span className="text-sm text-gray-600">{freezer.utilization}%</span>
                    </div>
                    <Progress
                      value={freezer.utilization}
                      className={`h-2 ${
                        freezer.utilization >= 90
                          ? "text-red-600"
                          : freezer.utilization >= 75
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
