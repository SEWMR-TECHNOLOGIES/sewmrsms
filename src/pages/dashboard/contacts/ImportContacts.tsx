import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeta } from "@/hooks/useMeta";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1/contacts";

export default function ImportContacts() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean).slice(0, 6);
      setPreview(lines.map((l) => l.split(",")));
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult({ imported: data.data?.imported ?? 0, skipped: data.data?.skipped ?? 0, errors: data.data?.errors ?? [] });
        toast({ title: "Import complete", description: `${data.data?.imported ?? 0} contacts imported.`, variant: "success" });
      } else {
        toast({ title: "Import failed", description: data.message || "Could not import contacts", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error during import", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "name,phone,email,group\nJohn Doe,255712345678,john@example.com,Customers\nJane Smith,255698765432,,VIPs";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useMeta({ title: "Import Contacts", description: "Bulk import contacts from a CSV file into your SEWMR SMS account." });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Contacts</h1>
          <p className="text-muted-foreground">Upload a CSV file to bulk import contacts into your database.</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" /> Download Template
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>File must have columns: name, phone. Optional: email, group</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Click or drag a CSV file here to upload</p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview[0]?.map((h, i) => (
                        <TableHead key={i}>{h.trim()}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(1).map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci}>{cell.trim()}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={60} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">Importing contacts...</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="mr-2 h-4 w-4" /> Import Contacts</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-primary/5 text-center">
                <p className="text-2xl font-bold text-primary">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold">{result.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1"><AlertCircle className="h-4 w-4 text-destructive" /> Errors:</p>
                {result.errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-sm text-muted-foreground pl-5">- {err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
