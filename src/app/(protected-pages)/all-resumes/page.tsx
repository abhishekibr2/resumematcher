"use client"

import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { resumeTableConfig } from "@/config/Table/resume";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Status = {
  _id: string;
  status: string;
};

export default function Dashboard() {
  const [status, setStatus] = useState<Status[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setStatusLoading(true);
        const response = await fetch('/api/status');

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        const statusArray = Array.isArray(data) ? data : [];

        setStatus(statusArray);
        setStatusError(statusArray.length === 0 ? 'No status found' : null);

        resumeTableConfig.columns.forEach((column) => {
          if (column.accessorKey === 'status') {
            column.options = statusArray.map((status: Status) => ({
              value: status.status,
              label: status.status
            }));
          }
        });
      } catch (error) {
        console.error('Error fetching status:', error);
        setStatusError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus([]);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (statusLoading) return (
    <div className="min-h-screen bg-background/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background p-8 rounded-xl shadow-lg flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading resumes...</p>
      </div>
    </div>
  );

  if (statusError) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
        <p className="text-destructive/80">{statusError}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        
        <div className="rounded-xl shadow-sm">
          <TableComponent config={resumeTableConfig} />
        </div>
      </div>
    </div>
  );
}