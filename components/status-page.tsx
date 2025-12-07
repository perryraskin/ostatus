"use client"

import { useState, useEffect, useCallback } from "react"
import type { Service, HealthCheckEndpoint } from "@/lib/types"
import { defaultServices, calculateAggregatedStatus } from "@/lib/health-check-store"
import { StatusOverview } from "./status-overview"
import { ServiceCard } from "./service-card"
import { ServiceForm } from "./service-form"
import { EndpointForm } from "./endpoint-form"
import { ColorPicker } from "./color-picker"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"

export function StatusPage() {
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | undefined>()
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<{
    serviceId: string
    endpoint?: HealthCheckEndpoint
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Simulate health check updates
  const runHealthChecks = useCallback(async () => {
    setIsRefreshing(true)

    // Simulate API calls with random status updates
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setServices((prevServices) =>
      prevServices.map((service) => ({
        ...service,
        endpoints: service.endpoints.map((endpoint) => {
          // Simulate random status changes (for demo)
          const statuses: HealthCheckEndpoint["status"][] = [
            "operational",
            "operational",
            "operational",
            "degraded",
            "outage",
          ]
          const randomStatus =
            Math.random() > 0.8 ? statuses[Math.floor(Math.random() * statuses.length)] : endpoint.status

          return {
            ...endpoint,
            status: randomStatus,
            responseTime: Math.floor(Math.random() * 500) + 50,
            lastCheck: new Date(),
          }
        }),
        lastUpdated: new Date(),
        aggregatedStatus: calculateAggregatedStatus(service.endpoints),
      })),
    )

    setLastRefresh(new Date())
    setIsRefreshing(false)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(runHealthChecks, 30000)
    return () => clearInterval(interval)
  }, [runHealthChecks])

  // Service handlers
  const handleSaveService = (service: Service) => {
    if (editingService) {
      setServices(services.map((s) => (s.id === service.id ? service : s)))
    } else {
      setServices([...services, service])
    }
    setShowServiceForm(false)
    setEditingService(undefined)
  }

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter((s) => s.id !== serviceId))
  }

  // Endpoint handlers
  const handleAddEndpoint = (serviceId: string) => {
    setEditingEndpoint({ serviceId })
    setShowEndpointForm(true)
  }

  const handleEditEndpoint = (serviceId: string, endpoint: HealthCheckEndpoint) => {
    setEditingEndpoint({ serviceId, endpoint })
    setShowEndpointForm(true)
  }

  const handleSaveEndpoint = (endpoint: HealthCheckEndpoint) => {
    if (!editingEndpoint) return

    setServices(
      services.map((service) => {
        if (service.id !== editingEndpoint.serviceId) return service

        const existingIndex = service.endpoints.findIndex((e) => e.id === endpoint.id)
        let newEndpoints: HealthCheckEndpoint[]

        if (existingIndex >= 0) {
          newEndpoints = service.endpoints.map((e) => (e.id === endpoint.id ? endpoint : e))
        } else {
          newEndpoints = [...service.endpoints, endpoint]
        }

        return {
          ...service,
          endpoints: newEndpoints,
          aggregatedStatus: calculateAggregatedStatus(newEndpoints),
          lastUpdated: new Date(),
        }
      }),
    )

    setShowEndpointForm(false)
    setEditingEndpoint(null)
  }

  const handleDeleteEndpoint = (serviceId: string, endpointId: string) => {
    setServices(
      services.map((service) => {
        if (service.id !== serviceId) return service

        const newEndpoints = service.endpoints.filter((e) => e.id !== endpointId)
        return {
          ...service,
          endpoints: newEndpoints,
          aggregatedStatus: calculateAggregatedStatus(newEndpoints),
          lastUpdated: new Date(),
        }
      }),
    )
  }

  // Group services by category
  const categories = [...new Set(services.map((s) => s.category || "Uncategorized"))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-black bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Service Status</h1>
              <p className="text-muted-foreground font-mono mt-1">Real-time health monitoring dashboard</p>
            </div>

            <div className="flex gap-3">
              <ColorPicker />
              <Button
                variant="outline"
                onClick={runHealthChecks}
                disabled={isRefreshing}
                className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Checking..." : "Refresh"}
              </Button>

              <Button
                onClick={() => {
                  setEditingService(undefined)
                  setShowServiceForm(true)
                }}
                className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Status Overview */}
        <StatusOverview services={services} />

        {/* Services by Category */}
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black uppercase">{category}</h2>
              <div className="flex-1 h-1 bg-black" />
            </div>

            <div className="space-y-4">
              {services
                .filter((s) => (s.category || "Uncategorized") === category)
                .map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={(s) => {
                      setEditingService(s)
                      setShowServiceForm(true)
                    }}
                    onDelete={handleDeleteService}
                    onAddEndpoint={handleAddEndpoint}
                    onEditEndpoint={handleEditEndpoint}
                    onDeleteEndpoint={handleDeleteEndpoint}
                  />
                ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {services.length === 0 && (
          <div className="border-4 border-dashed border-black p-12 text-center">
            <div className="text-6xl mb-4">📡</div>
            <h3 className="text-2xl font-black uppercase mb-2">No Services Configured</h3>
            <p className="text-muted-foreground mb-6">Add your first service to start monitoring</p>
            <Button
              onClick={() => {
                setEditingService(undefined)
                setShowServiceForm(true)
              }}
              className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Service
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-muted mt-auto">
        <div className="container mx-auto px-4 py-4 text-center font-mono text-sm">
          <span className="font-bold">Auto-refresh:</span> Every 30 seconds •
          <span className="font-bold ml-2">Last check:</span> {lastRefresh.toLocaleTimeString()}
        </div>
      </footer>

      {/* Modals */}
      {showServiceForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => {
            setShowServiceForm(false)
            setEditingService(undefined)
          }}
        />
      )}

      {showEndpointForm && editingEndpoint && (
        <EndpointForm
          endpoint={editingEndpoint.endpoint}
          onSave={handleSaveEndpoint}
          onCancel={() => {
            setShowEndpointForm(false)
            setEditingEndpoint(null)
          }}
        />
      )}
    </div>
  )
}
