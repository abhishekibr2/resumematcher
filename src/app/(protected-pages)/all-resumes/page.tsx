"use client"

import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { resumeTableConfig } from "@/config/Table/resume";
import { Loader, Loader2 } from "lucide-react";
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
        console.log(resumeTableConfig.columns);
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

  if (statusLoading) return <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>;
  if (statusError) return <div>{statusError}</div>;

  return <div>
    <TableComponent config={resumeTableConfig} />
  </div>;
}