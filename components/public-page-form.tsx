"use client"

import type React from "react"

import { useState } from "react"
import type { PublicPage, Service } from "@/lib/types"
import { generateId } from "@/lib/health-check-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Globe, Eye, EyeOff, Check, ExternalLink, Copy, Palette } from "lucide-react"

interface PublicPageFormProps {
  page?: PublicPage
  services: Service[]
  onSave: (page: PublicPage) => void
  onCancel: () => void
}

const PRESET_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
]

export function PublicPageForm({ page, services, onSave, onCancel }: PublicPageFormProps) {
  const [formData, setFormData] = useState<Partial<PublicPage>>({
    id: page?.id || generateId(),
    slug: page?.slug || "",
    title: page?.title || "Status Page",
    description: page?.description || "",
    logoUrl: page?.logoUrl || "",
    customDomain: page?.customDomain || "",
    serviceIds: page?.serviceIds || [],
    isPublished: page?.isPublished || false,
    showEndpointDetails: page?.showEndpointDetails !== false,
    primaryColor: page?.primaryColor || "#3b82f6",
  })
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      createdAt: page?.createdAt || new Date(),
      updatedAt: new Date(),
    } as PublicPage)
  }

  const toggleService = (serviceId: string) => {
    const current = formData.serviceIds || []
    const newIds = current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]
    setFormData({ ...formData, serviceIds: newIds })
  }

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/status/${formData.slug}` : `/status/${formData.slug}`

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-muted">
          <h2 className="text-xl font-black uppercase">{page ? "Edit Public Page" : "Create Public Page"}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 border-2 border-black hover:bg-background"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Page Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (!page && !formData.slug) {
                    setFormData((prev) => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))
                  }
                }}
                placeholder="My Service Status"
                className="border-2 border-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase mb-2">URL Slug *</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                    placeholder="my-status"
                    className="border-2 border-black font-mono"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">/status/{formData.slug || "your-slug"}</p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Real-time status updates for our services"
                className="border-2 border-black"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase mb-2">Logo URL</label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="border-2 border-black"
              />
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, primaryColor: color.value })}
                  className={`w-8 h-8 border-2 border-black transition-transform ${
                    formData.primaryColor === color.value ? "scale-110 shadow-[2px_2px_0px_0px_#000]" : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <Input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-8 h-8 p-0 border-2 border-black cursor-pointer"
              />
            </div>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Custom Domain (Optional)
            </label>
            <Input
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
              placeholder="status.yourdomain.com"
              className="border-2 border-black"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Point your domain's CNAME to this app's URL, then enter it here.
            </p>
          </div>

          {/* Select Services */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Select Services to Display *</label>
            {services.length === 0 ? (
              <div className="border-2 border-dashed border-black p-4 text-center text-muted-foreground">
                No services available. Create services first.
              </div>
            ) : (
              <div className="border-2 border-black divide-y-2 divide-black max-h-48 overflow-y-auto">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.serviceIds || []).includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-5 h-5 border-2 border-black accent-primary"
                    />
                    <div className="flex-1">
                      <div className="font-bold">{service.name}</div>
                      <div className="text-xs text-muted-foreground">{service.category}</div>
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 border border-black">
                      {service.endpoints.length} endpoints
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showEndpointDetails}
                onChange={(e) => setFormData({ ...formData, showEndpointDetails: e.target.checked })}
                className="w-5 h-5 border-2 border-black accent-primary"
              />
              <span className="font-bold">Show Endpoint Details</span>
              <span className="text-sm text-muted-foreground">(individual endpoint status)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-5 h-5 border-2 border-black accent-primary"
              />
              <span className="font-bold flex items-center gap-2">
                {formData.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Publish Page
              </span>
              <span className="text-sm text-muted-foreground">(make publicly accessible)</span>
            </label>
          </div>

          {/* Preview URL */}
          {formData.slug && (
            <div className="p-4 bg-muted border-2 border-black">
              <div className="text-sm font-bold uppercase mb-2">Public URL</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-background p-2 border border-black truncate">
                  {publicUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyUrl}
                  className="border-2 border-black bg-transparent"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                {formData.isPublished && (
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="sm" className="border-2 border-black bg-transparent">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-4 border-black">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(formData.serviceIds || []).length === 0 || !formData.slug}
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground disabled:opacity-50"
            >
              {page ? "Update Page" : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
