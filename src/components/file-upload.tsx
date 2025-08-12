
"use client";

import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  onUploadComplete: (base64: string) => void;
  onFileRemove: () => void;
  id: string;
}

export function FileUpload({ label, onUploadComplete, onFileRemove, id }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Limit file size (e.g., 500KB for base64)
      if (selectedFile.size > 500 * 1024) { 
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload a file smaller than 500KB for this method.",
        });
        return;
      }
      
      setIsLoading(true);
      setFileName(selectedFile.name);

      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => {
        const base64String = reader.result as string;
        onUploadComplete(base64String);
        setIsLoading(false);
        toast({
          title: "File Ready",
          description: `${selectedFile.name} is ready to be submitted.`,
        });
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not process the selected file.",
        });
        setIsLoading(false);
        setFileName(null);
      };
    }
  };

  const handleRemoveFile = () => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
    setFileName(null);
    setIsLoading(false);
    onFileRemove();
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {fileName ? (
        <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <File className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={fileName}>{fileName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="flex-shrink-0" disabled={isLoading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor={id}
            className={cn(
                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-card",
                isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/50"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              {isLoading ? (
                <>
                    <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Processing...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 500KB)</p>
                </>
              )}
            </div>
            <input id={id} type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept="image/png, image/jpeg, application/pdf" />
          </label>
        </div>
      )}
    </div>
  );
}
