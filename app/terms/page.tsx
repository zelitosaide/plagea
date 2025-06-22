"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Thermometer, FileText, Shield, AlertTriangle, Users, Gavel } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
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

        {/* Terms of Service Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Terms of Service
            </CardTitle>
            <CardDescription className="text-lg">Last updated: December 22, 2024</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using the Lab Freezer Manager system ("Service"), you agree to be bound by these Terms
                of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Acceptable Use Policy
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Permitted Uses</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Managing laboratory freezer inventory and monitoring</li>
                    <li>Recording sample storage and retrieval activities</li>
                    <li>Generating reports for research and compliance purposes</li>
                    <li>Configuring alerts and notifications for equipment monitoring</li>
                    <li>Collaborating with authorized laboratory personnel</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Prohibited Activities
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Unauthorized access to other users' data or accounts</li>
                    <li>Tampering with system security or attempting to breach safeguards</li>
                    <li>Sharing login credentials with unauthorized individuals</li>
                    <li>Using the system for non-laboratory or commercial purposes</li>
                    <li>Uploading malicious software or harmful content</li>
                    <li>Interfering with the proper functioning of the Service</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Accounts and Responsibilities
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  When you create an account with us, you must provide information that is accurate, complete, and
                  current at all times. You are responsible for safeguarding the password and for all activities that
                  occur under your account.
                </p>
                <div>
                  <h3 className="text-xl font-medium mb-2">Account Security</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Maintain the confidentiality of your login credentials</li>
                    <li>Notify administrators immediately of any unauthorized access</li>
                    <li>Use strong passwords and update them regularly</li>
                    <li>Log out of shared or public computers</li>
                    <li>Report security vulnerabilities to the system administrators</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Handling and Laboratory Compliance</h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Users must comply with all applicable laboratory protocols, institutional policies, and regulatory
                  requirements when using the Service. This includes but is not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Following Good Laboratory Practice (GLP) guidelines</li>
                  <li>Maintaining accurate and complete records</li>
                  <li>Protecting sensitive research data and intellectual property</li>
                  <li>Complying with biosafety and chemical safety protocols</li>
                  <li>Adhering to institutional review board (IRB) requirements</li>
                  <li>Following data retention and disposal policies</li>
                </ul>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Service Availability and Maintenance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to maintain high availability of the Service, but we do not guarantee uninterrupted access.
                The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Scheduled maintenance and updates</li>
                <li>Emergency repairs or security patches</li>
                <li>Network or infrastructure issues</li>
                <li>Force majeure events beyond our control</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We will provide advance notice of scheduled maintenance when possible and work to minimize service
                disruptions.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive
                property of Lab Freezer Manager and its licensors. The Service is protected by copyright, trademark, and
                other laws. Our trademarks and trade dress may not be used without our prior written consent.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You retain ownership of any research data, samples information, and other content you input into the
                Service. By using the Service, you grant us a limited license to process and store this data solely for
                the purpose of providing the Service to you.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Gavel className="h-6 w-6" />
                Limitation of Liability
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium">
                  IMPORTANT: Please read this section carefully as it limits our liability to you.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                In no event shall Lab Freezer Manager, nor its directors, employees, partners, agents, suppliers, or
                affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                resulting from your use of the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We are not responsible for any loss or damage to samples, research materials, or laboratory equipment
                that may result from system failures, user error, or other factors beyond our control.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason
                whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use
                the Service will cease immediately.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you wish to terminate your account, you may contact your system administrator. Upon termination, we
                will retain your data according to our data retention policy and applicable legal requirements.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
                revision is material, we will try to provide at least 30 days notice prior to any new terms taking
                effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-700 space-y-2">
                  <p>
                    <strong>Email:</strong> legal@lab.com
                  </p>
                  <p>
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </p>
                  <p>
                    <strong>Address:</strong>
                    <br />
                    Lab Freezer Manager
                    <br />
                    Legal Department
                    <br />
                    123 Research Drive
                    <br />
                    Science City, SC 12345
                  </p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">Acknowledgment</h2>
              <p className="text-blue-800 leading-relaxed">
                By using the Lab Freezer Manager service, you acknowledge that you have read these Terms of Service,
                understood them, and agree to be bound by them. If you do not agree to these Terms, you must not use the
                Service.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
