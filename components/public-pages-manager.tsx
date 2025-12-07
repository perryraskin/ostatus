"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { useUser } from "@stackframe/stack"
import type { PublicPage, Service } from "@/lib/types"
import { PublicPageForm } from "./public-page-form"
import { Button } from "@/components/ui/button"
import { Plus, Globe, ExternalLink, Settings, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PublicPagesManagerProps {
  services: Service[]
}

export function PublicPagesManager({ services }: PublicPagesManagerProps) {
  const user = useUser()
  const [showForm, setShowForm] = useState(false)
  const [editingPage, setEditingPage] = useState<PublicPage | undefined>()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: pages, isLoading } = useSWR<PublicPage[]>(user ? "/api/public-pages" : null, fetcher)

  const handleSave = async (page: PublicPage) => {
    try {
      const isNew = !editingPage
      const method = isNew ? "POST" : "PUT"
      const url = isNew ? "/api/public-pages" : `/api/public-pages/${page.id}`

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      })
      await mutate("/api/public-pages")
    } catch (error) {
      console.error("Failed to save public page:", error)
    }
    setShowForm(false)
    setEditingPage(undefined)
  }

  const handleDelete = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this public page?")) return
    try {
      await fetch(`/api/public-pages/${pageId}`, { method: "DELETE" })
      await mutate("/api/public-pages")
    } catch (error) {
      console.error("Failed to delete public page:", error)
    }
  }

  const copyUrl = (page: PublicPage) => {
    const url = `${window.location.origin}/status/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(page.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) return null

  return (
    <div className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase">Public Status Pages</h2>
        </div>
        <Button
          onClick={() => {
            setEditingPage(undefined)
            setShowForm(true)
          }}
          className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : pages && pages.length > 0 ? (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 border-2 border-black hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-white"
                  style={{ backgroundColor: page.primaryColor }}
                >
                  {page.title[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {page.title}
                    {page.isPublished ? (
                      <span className="px-2 py-0.5 text-xs font-mono border border-emerald-500 bg-emerald-500/10 text-emerald-700 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-mono border border-black bg-muted flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    /status/{page.slug}
                    {page.customDomain && <span className="ml-2 text-primary">• {page.customDomain}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-muted px-2 py-1 border border-black">
                  {page.serviceIds.length} service{page.serviceIds.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyUrl(page)}
                  className="h-8 w-8 p-0 border-2 border-black hover:bg-muted"
                >
                  {copiedId === page.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                {page.isPublished && (
                  <a href={`/status/${page.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 border-2 border-black hover:bg-primary hover:text-primary-foreground"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPage(page)
                    setShowForm(true)
                  }}
                  className="h-8 w-8 p-0 border-2 border-black hover:bg-primary hover:text-primary-foreground"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(page.id)}
                  className="h-8 w-8 p-0 border-2 border-black hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-black">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-bold mb-2">No Public Pages Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a public status page to share with your users</p>
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="border-2 border-black shadow-[4px_4px_0px_0px_#000]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Page
          </Button>
        </div>
      )}

      {showForm && (
        <PublicPageForm
          page={editingPage}
          services={services}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingPage(undefined)
          }}
        />
      )}
    </div>
  )
}
