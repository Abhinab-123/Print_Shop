import { useParams, Link } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicSuccess() {
  const { id } = useParams();
  const { data: job, isLoading } = useJob(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="w-full max-w-md h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Job Not Found</h1>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center space-y-6 shadow-xl border-border/50">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold">Success!</h1>
            <p className="text-muted-foreground">
              Your document has been queued for printing.
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6 border border-border/50">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Job Reference</p>
            <p className="text-4xl font-mono font-bold tracking-tight">#{job.id.toString().padStart(4, '0')}</p>
          </div>

          <div className="text-sm text-left space-y-2 text-muted-foreground bg-secondary/20 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>File:</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">{job.originalFilename}</span>
            </div>
            <div className="flex justify-between">
              <span>Copies:</span>
              <span className="font-medium text-foreground">{job.copies}</span>
            </div>
            <div className="flex justify-between">
              <span>Color:</span>
              <span className="font-medium text-foreground">{job.isColor ? "Yes" : "No"}</span>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/print">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Print Another Document
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
