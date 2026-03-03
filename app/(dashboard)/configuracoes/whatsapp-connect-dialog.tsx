"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QrCode, Wifi, RefreshCw } from "lucide-react"
import Image from "next/image"

export function WhatsAppConnectDialog() {
  const [open, setOpen]         = useState(false)
  const [qrCode, setQrCode]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetchQRCode = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/whatsapp/qrcode")
      const data = await res.json() as { base64?: string; error?: string }
      if (data.error) {
        setError(data.error)
      } else {
        setQrCode(data.base64 ?? null)
      }
    } catch {
      setError("Falha ao carregar QR code")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch QR code when dialog opens and refresh every 25s (expires in ~30s)
  useEffect(() => {
    if (!open) return

    fetchQRCode()
    const interval = setInterval(fetchQRCode, 25000)
    return () => clearInterval(interval)
  }, [open, fetchQRCode])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="h-4 w-4" />
          Conectar WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Abra o WhatsApp no seu celular → Dispositivos conectados → Conectar dispositivo
            e escaneie o QR code abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {loading ? (
            <Skeleton className="h-64 w-64 rounded-lg" />
          ) : error ? (
            <div className="h-64 w-64 flex flex-col items-center justify-center gap-3 border rounded-lg text-center p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchQRCode}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : qrCode ? (
            <div className="relative">
              <Image
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="rounded-lg border"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-64 w-64 flex items-center justify-center border rounded-lg text-muted-foreground text-sm">
              QR code não disponível
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>QR code atualiza automaticamente a cada 25s</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
