"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import type { Service, HealthCheckEndpoint } from "@/lib/types"
import { defaultServices, calculateAggregatedStatus, generateId } from "@/lib/health-check-store"
import { StatusOverview } from "./status-overview"
import { ServiceCard } from "./service-card"
import { ServiceForm } from "./service-form"
import { EndpointForm } from "./endpoint-form"
import { ColorPicker } from "./color-picker"
import { DemoModeBanner } from "./demo-mode-banner"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Play } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StatusPage() {
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoServices, setDemoServices] = useState<Service[]>([])

  // Fetch services from database
  const {
    data: dbServices,
    error,
    isLoading,
  } = useSWR<Service[]>("/api/services", fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
  })

  // Use demo services or database services
  const services = isDemoMode ? demoServices : dbServices || []

  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | undefined>()
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<{
    serviceId: string
    endpoint?: HealthCheckEndpoint
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Enter demo mode with sample data
  const enterDemoMode = () => {
    setDemoServices(
      defaultServices.map((s) => ({
        ...s,
        id: generateId(),
        endpoints: s.endpoints.map((e) => ({ ...e, id: generateId() })),
      })),
    )
    setIsDemoMode(true)
  }

  // Exit demo mode
  const exitDemoMode = () => {
    setIsDemoMode(false)
    setDemoServices([])
  }

  // Simulate health check updates (demo mode) or trigger real refresh
  const runHealthChecks = useCallback(async () => {
    setIsRefreshing(true)

    if (isDemoMode) {
      // Simulate API calls with random status updates for demo
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setDemoServices((prevServices) =>
        prevServices.map((service) => ({
          ...service,
          endpoints: service.endpoints.map((endpoint) => {
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
    } else {
      // Refresh from database
      await mutate("/api/services")
    }

    setLastRefresh(new Date())
    setIsRefreshing(false)
  }, [isDemoMode])

  // Service handlers
  const handleSaveService = async (service: Service) => {
    if (isDemoMode) {
      if (editingService) {
        setDemoServices(demoServices.map((s) => (s.id === service.id ? service : s)))
      } else {
        setDemoServices([...demoServices, service])
      }
    } else {
      try {
        if (editingService) {
          await fetch(`/api/services/${service.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(service),
          })
        } else {
          await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(service),
          })
        }
        await mutate("/api/services")
      } catch (error) {
        console.error("Failed to save service:", error)
      }
    }
    setShowServiceForm(false)
    setEditingService(undefined)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (isDemoMode) {
      setDemoServices(demoServices.filter((s) => s.id !== serviceId))
    } else {
      try {
        await fetch(`/api/services/${serviceId}`, { method: "DELETE" })
        await mutate("/api/services")
      } catch (error) {
        console.error("Failed to delete service:", error)
      }
    }
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

  const handleSaveEndpoint = async (endpoint: HealthCheckEndpoint) => {
    if (!editingEndpoint) return

    if (isDemoMode) {
      setDemoServices(
        demoServices.map((service) => {
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
    } else {
      try {
        const isNew = !editingEndpoint.endpoint
        const method = isNew ? "POST" : "PUT"
        const url = isNew ? "/api/endpoints" : `/api/endpoints/${endpoint.id}`

        await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...endpoint,
            serviceId: editingEndpoint.serviceId,
            requestBody: endpoint.body,
          }),
        })
        await mutate("/api/services")
      } catch (error) {
        console.error("Failed to save endpoint:", error)
      }
    }

    setShowEndpointForm(false)
    setEditingEndpoint(null)
  }

  const handleDeleteEndpoint = async (serviceId: string, endpointId: string) => {
    if (isDemoMode) {
      setDemoServices(
        demoServices.map((service) => {
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
    } else {
      try {
        await fetch(`/api/endpoints/${endpointId}?serviceId=${serviceId}`, { method: "DELETE" })
        await mutate("/api/services")
      } catch (error) {
        console.error("Failed to delete endpoint:", error)
      }
    }
  }

  // Group services by category
  const categories = [...new Set(services.map((s) => s.category || "Uncategorized"))]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Demo Mode Banner */}
      {isDemoMode && <DemoModeBanner onExit={exitDemoMode} />}

      {/* Header */}
      <header className="border-b-4 border-black bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Service Status</h1>
              <p className="text-muted-foreground font-mono mt-1">Real-time health monitoring dashboard</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ColorPicker />

              {!isDemoMode && (
                <Button
                  variant="outline"
                  onClick={enterDemoMode}
                  className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-amber-100 hover:bg-amber-200"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try Demo
                </Button>
              )}

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
      <main className="container mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Loading State */}
        {isLoading && !isDemoMode && (
          <div className="border-4 border-black p-12 text-center bg-card shadow-[8px_8px_0px_0px_#000]">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase">Loading Services...</h3>
          </div>
        )}

        {/* Error State */}
        {error && !isDemoMode && (
          <div className="border-4 border-red-500 p-12 text-center bg-red-50">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black uppercase mb-2 text-red-600">Failed to Load Services</h3>
            <p className="text-muted-foreground mb-6">Please check your database connection and try again.</p>
            <Button
              onClick={() => mutate("/api/services")}
              className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-primary text-primary-foreground"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Status Overview */}
        {!isLoading && !error && <StatusOverview services={services} />}

        {/* Services by Category */}
        {!isLoading &&
          !error &&
          categories.map((category) => (
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
        {!isLoading && !error && services.length === 0 && (
          <div className="border-4 border-dashed border-black p-12 text-center">
            <div className="text-6xl mb-4">📡</div>
            <h3 className="text-2xl font-black uppercase mb-2">No Services Configured</h3>
            <p className="text-muted-foreground mb-6">
              Add your first service to start monitoring, or try the demo to explore.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button
                variant="outline"
                onClick={enterDemoMode}
                className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-amber-100 hover:bg-amber-200"
              >
                <Play className="w-4 h-4 mr-2" />
                Try Demo Mode
              </Button>
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
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-muted mt-auto">
        <div className="container mx-auto px-4 py-4 text-center font-mono text-sm">
          <span className="font-bold">Auto-refresh:</span> Every 30 seconds •
          <span className="font-bold ml-2">Last check:</span> {lastRefresh.toLocaleTimeString()}
          {isDemoMode && <span className="ml-2 text-amber-600 font-bold">• DEMO MODE</span>}
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
