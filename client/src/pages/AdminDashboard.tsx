import { useAuth } from "@/hooks/use-auth";
import { useJobs, useUpdateJobStatus } from "@/hooks/use-jobs";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildUrl, api } from "@shared/routes";
import { MoreHorizontal, Download, Printer, CheckCircle, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: jobs, isLoading: isJobsLoading } = useJobs();
  const { mutate: updateStatus } = useUpdateJobStatus();
  const [, setLocation] = useLocation();

  // Protect route
  if (!isAuthLoading && !user) {
    setLocation("/admin/login");
    return null;
  }

  if (isAuthLoading || isJobsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sort jobs: PENDING first, then by date desc
  const sortedJobs = jobs?.sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleDownload = async (id: number) => {
    const url = buildUrl(api.jobs.download.path, { id });
    try {
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
          filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else if (response.status === 401) {
        setLocation("/admin/login");
      }
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const handleView = async (id: number) => {
    const url = buildUrl(api.jobs.download.path, { id }) + "?inline=true";
    try {
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const blob = await response.blob();
        const contentType = response.headers.get('Content-Type') || 'application/pdf';
        const viewBlob = new Blob([blob], { type: contentType });
        const viewUrl = window.URL.createObjectURL(viewBlob);
        window.open(viewUrl, "_blank");
      } else if (response.status === 401) {
        setLocation("/admin/login");
      }
    } catch (error) {
      console.error("View failed", error);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Print Queue</h1>
          <p className="text-muted-foreground mt-1">Manage incoming print requests</p>
        </div>
        <div className="bg-secondary px-4 py-2 rounded-lg border">
          <span className="font-mono font-bold text-lg">{jobs?.filter(j => j.status === 'PENDING').length}</span>
          <span className="ml-2 text-sm text-muted-foreground">Pending</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="w-[100px]">Job ID</TableHead>
              <TableHead>File Info</TableHead>
              <TableHead className="hidden md:table-cell">Options</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No print jobs found.
                </TableCell>
              </TableRow>
            ) : (
              sortedJobs?.map((job) => (
                <TableRow key={job.id} className="group">
                  <TableCell className="font-mono font-medium">#{job.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px] sm:max-w-[300px]" title={job.originalFilename}>
                        {job.originalFilename}
                      </span>
                      {job.displayName && (
                        <span className="text-xs text-muted-foreground">User: {job.displayName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-1.5 py-0.5 rounded border">
                        {job.copies} cop{job.copies > 1 ? 'ies' : 'y'}
                      </span>
                      {job.isColor && (
                        <span className="bg-purple-100 text-purple-700 border-purple-200 px-1.5 py-0.5 rounded border">Color</span>
                      )}
                      {job.pageRange && (
                        <span className="bg-orange-100 text-orange-700 border-orange-200 px-1.5 py-0.5 rounded border">Pp: {job.pageRange}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status as any} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(job.createdAt), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(job.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(job.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download File
                        </DropdownMenuItem>
                        
                        {job.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => updateStatus({ id: job.id, status: "PRINTING" })}>
                            <Printer className="mr-2 h-4 w-4" />
                            Mark Printing
                          </DropdownMenuItem>
                        )}
                        
                        {job.status === "PRINTING" && (
                          <DropdownMenuItem onClick={() => updateStatus({ id: job.id, status: "COMPLETED" })}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => window.open(buildUrl(api.jobs.download.path, { id: job.id }), "_blank")}>
                           <FileText className="mr-2 h-4 w-4" />
                           View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
