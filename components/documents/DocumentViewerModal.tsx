'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ZoomIn, ZoomOut, RotateCcw, Download, Lock } from 'lucide-react'

type DocumentViewerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileUrl: string
  title?: string
  locked: boolean
  onDownload?: () => void
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  fileUrl,
  title = 'Document Viewer',
  locked,
  onDownload
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleZoomReset = () => setZoom(1)

  if (locked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Document Locked
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <p>Document is locked. Verify OTP to view.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/20 rounded-lg">
          <div className="flex items-center justify-center min-h-full p-4">
            <div
              className="transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              {fileUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={fileUrl}
                  className="w-[800px] h-[600px] border rounded-lg bg-white"
                  title={title}
                />
              ) : (
                <img
                  src={fileUrl}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{ maxWidth: '800px', maxHeight: '600px' }}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}