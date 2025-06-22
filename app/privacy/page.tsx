"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Thermometer, Shield, Eye, Database, Users, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
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

        {/* Privacy Policy Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Privacy Policy
            </CardTitle>
            <CardDescription className="text-lg">Last updated: December 22, 2024</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PlaGeA - Plataforma de Gestão de Amostras ("we," "our," or "us") is committed to protecting your privacy and ensuring the
                security of your personal information. This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our laboratory freezer management system.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-6 w-6" />
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Department and job title</li>
                    <li>Login credentials and authentication data</li>
                    <li>User preferences and system settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Laboratory Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Sample information and inventory data</li>
                    <li>Freezer usage and monitoring logs</li>
                    <li>Temperature and alert records</li>
                    <li>Maintenance and service history</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>IP addresses and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Usage patterns and system interactions</li>
                    <li>Error logs and performance data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and maintain the freezer management system</li>
                <li>Authenticate users and manage access permissions</li>
                <li>Monitor system performance and security</li>
                <li>Send alerts and notifications about freezer status</li>
                <li>Generate reports and analytics for laboratory operations</li>
                <li>Provide technical support and customer service</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and user authentication</li>
                <li>Secure backup and disaster recovery procedures</li>
                <li>Employee training on data protection practices</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in the
                following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>With your explicit consent</li>
                <li>To authorized laboratory personnel for legitimate research purposes</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect the rights, property, or safety of our users or others</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this
                Privacy Policy, unless a longer retention period is required or permitted by law. Laboratory data may be
                retained for extended periods to support ongoing research and regulatory compliance.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Right to access and obtain a copy of your personal data</li>
                <li>Right to rectify inaccurate or incomplete information</li>
                <li>Right to erase your personal data under certain circumstances</li>
                <li>Right to restrict or object to processing</li>
                <li>Right to data portability</li>
                <li>Right to withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Email: privacy@lab.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Phone: +1 (555) 123-4567</span>
                </div>
                <div className="text-gray-700">
                  <strong>Address:</strong>
                  <br />
                  Lab Freezer Manager
                  <br />
                  Data Protection Office
                  <br />
                  123 Research Drive
                  <br />
                  Science City, SC 12345
                </div>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
                Privacy Policy periodically for any changes.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
