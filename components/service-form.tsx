"use client"

import type React from "react"

import { useState } from "react"
import type { Service } from "@/lib/types"
import { generateId } from "@/lib/health-check-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface ServiceFormProps {
  service?: Service
  onSave: (service: Service) => void
  onCancel: () => void
}

export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [name, setName] = useState(service?.name || "")
  const [description, setDescription] = useState(service?.description || "")
  const [category, setCategory] = useState(service?.category || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newService: Service = {
      id: service?.id || generateId(),
      name,
      description,
      category,
      endpoints: service?.endpoints || [],
      aggregatedStatus: service?.aggregatedStatus || "unknown",
      lastUpdated: new Date(),
    }

    onSave(newService)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-accent">
          <h2 className="text-xl font-black uppercase text-accent-foreground">
            {service ? "Edit Service" : "Add New Service"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 border-2 border-black bg-card hover:bg-primary hover:text-primary-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold uppercase">
              Service Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Authentication API"
              required
              className="border-2 border-black font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold uppercase">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., User authentication and authorization"
              className="border-2 border-black font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="font-bold uppercase">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Core Services"
              className="border-2 border-black font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
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
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#00cc00] text-black hover:bg-[#00cc00]/90"
            >
              {service ? "Update" : "Create"} Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
