"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Thermometer, HelpCircle, Phone, Mail, Clock, MessageSquare, Book, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert("Support request submitted successfully! We'll get back to you within 24 hours.")
    setFormData({
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/login">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <Thermometer className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PlaGeA - Plataforma de Gestão de Amostras</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" />
                  Get Help
                </CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Phone Support</p>
                    <p className="text-sm text-blue-700">+1 (555) 123-4567</p>
                    <p className="text-xs text-blue-600">Mon-Fri, 8AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Email Support</p>
                    <p className="text-sm text-green-700">support@lab.com</p>
                    <p className="text-xs text-green-600">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Emergency Support</p>
                    <p className="text-sm text-purple-700">+1 (555) 911-HELP</p>
                    <p className="text-xs text-purple-600">24/7 for critical issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-6 w-6" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Common Issues</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Password reset instructions</li>
                    <li>• Freezer alert troubleshooting</li>
                    <li>• Sample tracking guide</li>
                    <li>• Temperature monitoring setup</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Documentation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• User manual (PDF)</li>
                    <li>• Video tutorials</li>
                    <li>• API documentation</li>
                    <li>• Best practices guide</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Submit Support Request
                </CardTitle>
                <CardDescription>
                  Fill out the form below and our support team will get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john.doe@lab.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Issue Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account & Access</SelectItem>
                        <SelectItem value="freezer">Freezer Management</SelectItem>
                        <SelectItem value="alerts">Alerts & Notifications</SelectItem>
                        <SelectItem value="reports">Reports & Data</SelectItem>
                        <SelectItem value="training">Training & Documentation</SelectItem>
                        <SelectItem value="billing">Billing & Licensing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, and your system environment."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Before submitting:</p>
                        <ul className="text-yellow-700 mt-1 space-y-1">
                          <li>• Check if your issue is covered in our FAQ</li>
                          <li>• Include relevant error messages or screenshots</li>
                          <li>• Specify which freezer(s) are affected</li>
                          <li>• Mention your browser and operating system</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Support Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current status of Lab Freezer Manager services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Core System</span>
                    </div>
                    <span className="text-sm text-green-700">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Alert System</span>
                    </div>
                    <span className="text-sm text-green-700">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Data Backup</span>
                    </div>
                    <span className="text-sm text-green-700">Operational</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Last updated: December 22, 2024 at 3:45 PM EST</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
