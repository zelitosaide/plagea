"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
import { 
  Download,
  Home, 
  LogOut, 
  TestTube, 
  Thermometer, 
  // BarChart3, 
  // Settings, 
  // Download
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "./ui/button"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Amostras", href: "/samples", icon: TestTube },
  { name: "Congeladores", href: "/freezers", icon: Thermometer },
  // { name: "Relatórios", href: "/reports", icon: BarChart3 },
  // { name: "Configurações", href: "/settings", icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuth();

  // const handleExportData = () => {
  //   alert("Exporting data... This feature will be available soon!")
  // }

  return isAuthenticated && (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="block leading-3 w-1/3">
              <div className="font-black text-2xl text-green-600">PlaGeA</div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-s-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 gap-2 cursor-pointer",
                        isActive
                          ? "bg-green-600 text-white hover:bg-green-500/100"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <Button variant="outline" size="sm" onClick={() => {}} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link> */}
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
