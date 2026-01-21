import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type UpdateJobStatusRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job");
      return api.jobs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number } & UpdateJobStatusRequest) => {
      const url = buildUrl(api.jobs.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.jobs.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update status");
      return api.jobs.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, data.id] });
      toast({ title: "Status updated", description: `Job marked as ${data.status}` });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not update job status", variant: "destructive" });
    },
  });
}

export function useCreateJob() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.jobs.create.path, {
        method: api.jobs.create.method,
        body: formData, // Browser sets Content-Type to multipart/form-data automatically
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Upload failed");
        }
        throw new Error("Upload failed");
      }
      const data = await res.json();
      // Handle both single and array response
      if (Array.isArray(data)) {
        return data.map(item => api.jobs.create.responses[201].parse(item))[0];
      }
      return api.jobs.create.responses[201].parse(data);
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}
