/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { getSessionReportAction } from "@/app/actions/training-actions"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { format } from "date-fns"
import { Skeleton } from "./ui/skeleton"

interface SessionReportDialogProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
}

const SessionReportDialog = ({ isOpen, onClose, sessionId }: SessionReportDialogProps) => {
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && sessionId) {
      const fetchReport = async () => {
        setIsLoading(true)
        const res = await getSessionReportAction(sessionId)
        if (res.success) setReport(res.data)
        setIsLoading(false)
      }
      fetchReport()
    }
  }, [isOpen, sessionId])
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Training Session Report</DialogTitle>
          {report && <DialogDescription>Report for {report.position} on {format(new Date(report.sessionDate), 'PPP')}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-6 space-y-6 mt-4">
          {isLoading ? <Skeleton className="w-full h-64" /> : !report ? <p>Report not found.</p> : (
            <>
              {Object.entries(report.sections).map(([sectionTitle, items]) => (
                <div key={sectionTitle}>
                  <h3 className="text-lg font-semibold mb-2 p-2 bg-muted rounded-md">{sectionTitle}</h3>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 text-xs text-muted-foreground font-bold px-2 py-1">
                    <div className="col-span-4">Competency</div>
                    <div className="col-span-2 text-center">Mentor Input</div>
                    <div className="col-span-2 text-center">Performance</div>
                    <div className="col-span-4">Notes</div>
                  </div>
                  {(items as any[]).map(result => (
                    <div key={result.id} className="grid grid-cols-12 gap-4 items-center border-b py-2 text-sm">
                      <p className="col-span-4">{result.competencyItem.competency}</p>
                      <p className="col-span-2 text-center font-mono text-xs">{result.mentorInput}</p>
                      <p className="col-span-2 text-center font-mono text-xs">{result.performanceLevel}</p>
                      <p className="col-span-4 italic text-muted-foreground">{result.notes || '-'}</p>
                    </div>
                  ))}
                </div>
              ))}
              <div className="space-y-2 pt-4">
                <h4 className="font-semibold">General Notes</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 whitespace-pre-wrap">
                  {report.notes || <em>No general notes provided.</em>}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SessionReportDialog