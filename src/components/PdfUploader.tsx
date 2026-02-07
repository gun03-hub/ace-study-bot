import React, { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PdfUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  disabled?: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onTextExtracted, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);

  const processFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    setFile(selectedFile);
    setExtracting(true);

    try {
      const text = await extractTextFromPdf(selectedFile);
      if (text.trim().length < 50) {
        toast.error("Could not extract enough text from this PDF. Try a different file.");
        setFile(null);
        setExtracting(false);
        return;
      }
      onTextExtracted(text, selectedFile.name);
      toast.success(`Extracted text from "${selectedFile.name}"`);
    } catch (err) {
      console.error("PDF extraction error:", err);
      toast.error("Failed to extract text from PDF. The file may be image-based or corrupted.");
      setFile(null);
    } finally {
      setExtracting(false);
    }
  }, [onTextExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <label
                className={`flex flex-col items-center justify-center gap-4 cursor-pointer p-10 border-2 border-dashed rounded-lg transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-foreground">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supports PDF files up to 20MB
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={disabled}
                />
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="file-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                {extracting ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : (
                  <FileText className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {extracting ? "Extracting text..." : `${(file.size / 1024).toFixed(1)} KB • Ready`}
                </p>
              </div>
              {!extracting && (
                <Button variant="ghost" size="icon" onClick={removeFile} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default PdfUploader;
