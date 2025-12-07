"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, CheckCircle, XCircle, Loader2, Copy, Check, AlertTriangle, RefreshCw, Trash2 } from "lucide-react"

interface DomainSetupProps {
  pageId: string
  currentDomain?: string
  domainVerified?: boolean
  onDomainChange: (domain: string | null, verified: boolean) => void
}

export function DomainSetup({ pageId, currentDomain, domainVerified, onDomainChange }: DomainSetupProps) {
  const [domain, setDomain] = useState(currentDomain || "")
  const [isAdding, setIsAdding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean
    misconfigured?: boolean
    cnames?: string[]
    aValues?: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (currentDomain) {
      checkVerification()
    }
  }, [currentDomain])

  const checkVerification = async () => {
    if (!currentDomain) return

    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/domains?domain=${encodeURIComponent(currentDomain)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setVerificationStatus(data)
        if (data.verified !== domainVerified) {
          onDomainChange(currentDomain, data.verified)
        }
      }
    } catch (err) {
      setError("Failed to check domain status")
    } finally {
      setIsChecking(false)
    }
  }

  const addDomain = async () => {
    if (!domain.trim()) return

    setIsAdding(true)
    setError(null)

    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), pageId }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        onDomainChange(domain.trim(), data.verified || false)
        checkVerification()
      }
    } catch (err) {
      setError("Failed to add domain")
    } finally {
      setIsAdding(false)
    }
  }

  const removeDomain = async () => {
    if (!currentDomain) return

    setIsRemoving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/domains?domain=${encodeURIComponent(currentDomain)}&pageId=${encodeURIComponent(pageId)}`,
        { method: "DELETE" },
      )

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setDomain("")
        setVerificationStatus(null)
        onDomainChange(null, false)
      }
    } catch (err) {
      setError("Failed to remove domain")
    } finally {
      setIsRemoving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold uppercase flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Custom Domain
      </label>

      {!currentDomain ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="status.yourdomain.com"
              className="border-2 border-black flex-1"
            />
            <Button
              type="button"
              onClick={addDomain}
              disabled={!domain.trim() || isAdding}
              className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-primary text-primary-foreground"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Domain"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your custom domain to get DNS configuration instructions.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-4 border-2 border-black bg-muted">
          {/* Domain Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold">{currentDomain}</code>
              {verificationStatus?.verified ? (
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : verificationStatus?.misconfigured ? (
                <span className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  Misconfigured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                  <XCircle className="w-4 h-4" />
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkVerification}
                disabled={isChecking}
                className="border-2 border-black bg-transparent"
              >
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeDomain}
                disabled={isRemoving}
                className="border-2 border-black bg-transparent text-red-600 hover:bg-red-50"
              >
                {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* DNS Instructions */}
          {!verificationStatus?.verified && (
            <div className="space-y-3 p-3 bg-background border-2 border-black">
              <div className="text-sm font-bold">DNS Configuration Required</div>
              <p className="text-xs text-muted-foreground">Add the following DNS record to your domain provider:</p>

              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="font-bold">Type</div>
                  <div className="font-bold">Name</div>
                  <div className="font-bold">Value</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-muted p-2 border border-black">
                  <div>CNAME</div>
                  <div>{currentDomain.split(".")[0]}</div>
                  <div className="flex items-center gap-1">
                    <span className="truncate">cname.vercel-dns.com</span>
                    <button type="button" onClick={() => copyToClipboard("cname.vercel-dns.com")} className="shrink-0">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                DNS changes can take up to 48 hours to propagate. Click refresh to check status.
              </p>
            </div>
          )}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">{error}</div>}
    </div>
  )
}
