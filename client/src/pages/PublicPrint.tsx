import { useState } from "react";
import { useCreateJob } from "@/hooks/use-jobs";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Upload, FileText, Check, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

export default function PublicPrint() {
  const [, setLocation] = useLocation();
  const { mutate: createJob, isPending } = useCreateJob();
  
  const [files, setFiles] = useState<File[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [pageRange, setPageRange] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !displayName) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("displayName", displayName);
    formData.append("copies", String(copies));
    formData.append("isColor", String(isColor));
    if (pageRange) formData.append("pageRange", pageRange);

    createJob(formData, {
      onSuccess: (data) => {
        // Since we now create multiple jobs, the response might be an array
        // For simplicity, we navigate to the dashboard or first job success
        const id = Array.isArray(data) ? data[0].id : data.id;
        setLocation(`/print/success/${id}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="bg-primary text-primary-foreground p-3 rounded-2xl w-fit mx-auto shadow-lg mb-6">
            <Upload className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Print Your Documents
          </h1>
          <p className="text-muted-foreground text-lg text-balance">
            Upload your files securely and pick them up at the counter.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-xl border-border/60 bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base font-medium">Your Name</Label>
              <Input 
                id="displayName" 
                placeholder="Enter your name (mandatory)" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-background h-12 text-lg"
              />
            </div>

            <Separator />

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-base font-medium">Select Document</Label>
              <div className="relative group">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className={`
                    flex flex-col items-center justify-center w-full min-h-32 py-4
                    border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                    hover:border-primary hover:bg-primary/5
                    ${files.length > 0 ? 'border-primary bg-primary/5' : 'border-input bg-background'}
                  `}
                >
                  {files.length > 0 ? (
                    <div className="flex flex-col gap-2 w-full px-4">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 text-primary">
                          <FileText className="w-5 h-5 shrink-0" />
                          <span className="font-medium truncate flex-1 text-sm">{file.name}</span>
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Click to upload multiple files</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Separator />

            {/* Basic Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Color Print</Label>
                  <p className="text-xs text-muted-foreground">Standard is Black & White</p>
                </div>
                <Switch
                  checked={isColor}
                  onCheckedChange={setIsColor}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="copies" className="text-base">Number of Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  min={1}
                  max={999}
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="bg-background h-12 text-lg"
                />
              </div>
            </div>

            {/* Advanced Toggle */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none">
                <Settings className="w-4 h-4" />
                Advanced Options (Page Range)
              </summary>
              <div className="pt-4 space-y-4 animate-accordion-down">
                <div className="space-y-2">
                  <Label htmlFor="pageRange">Page Range (Optional)</Label>
                  <Input 
                    id="pageRange" 
                    placeholder="e.g. 1-5, 8" 
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            </details>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
              disabled={files.length === 0 || !displayName || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Send ${files.length} ${files.length === 1 ? 'File' : 'Files'} to Printer`
              )}
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          Accepted formats: PDF, DOC, DOCX, PPT, PPTX up to 25MB.
        </p>
      </motion.div>
    </div>
  );
}
