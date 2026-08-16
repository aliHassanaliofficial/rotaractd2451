'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, CameraOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface QRScannerProps {
  onScan: (data: { id: string; ticket: string; event: string }) => void
  onError?: (error: string) => void
  className?: string
}

export function QRScanner({ onScan, onError, className }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    if (!containerRef.current) return
    setInitializing(true)

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.id && data.ticket) {
              onScan(data)
              scanner.stop().catch(() => {})
              setScanning(false)
            }
          } catch {
            onError?.('Invalid QR code format')
          }
        },
        () => {}
      )

      setScanning(true)
    } catch (err) {
      onError?.('Camera access denied or unavailable')
    } finally {
      setInitializing(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
    }
    setScanning(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        id="qr-reader"
        ref={containerRef}
        className={cn(
          'overflow-hidden rounded-2xl border-2',
          scanning ? 'border-gold' : 'border-dashed border-gray-300'
        )}
        style={{ minHeight: 250 }}
      />

      <div className="flex justify-center">
        {!scanning ? (
          <Button onClick={startScanning} disabled={initializing}>
            {initializing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Start Scanning
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopScanning}>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  )
}
