import React, { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { UploadProgress } from "@/components/ui/upload-progress";
import { useUpload } from "@/hooks/useUpload";
import { FileUpload } from "@/components/ui/file-upload";
import { useMeta } from "@/hooks/useMeta";

const MAX_FILE_SIZE = 524288; // 0.5 MB

export default function UploadAgreement() {
  const { uuid } = useParams<{ uuid: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { progress, uploadFile, resetProgress } = useUpload();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Missing file",
        description: "Please upload the signed agreement (PDF).",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await uploadFile(
        `https://api.sewmrsms.co.tz/api/v1/sender-ids/${uuid}/upload-signed-agreement`,
        selectedFile
      );

      if (!res.ok) {
        let errMsg = "Upload failed";
        try {
          const json = await res.json();
          errMsg = json?.detail || json?.message || errMsg;
        } catch {}
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: errMsg,
        });
      } else {
        const data = await res.json();
        toast({
          variant: "success",
          title: "Agreement uploaded",
          description: data?.message || "Upload successful",
        });
        navigate("/console/sender-ids");
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Unable to reach the server. Try again shortly.",
      });
    } finally {
      setLoading(false);
      resetProgress();
    }
  };

  useMeta({
    title: "Upload Sender ID Agreement",
    description: "Upload your signed sender ID agreement (PDF) to complete the verification process."
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/console/sender-ids")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Upload Agreement</h1>
          <p className="text-muted-foreground">Upload your signed sender ID agreement (PDF)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Signed Agreement
          </CardTitle>
          <CardDescription>
            Please upload your signed agreement in PDF format. Maximum file size 0.5 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <FileUpload accept=".pdf" maxSize={0.5} onFileSelect={(files) => setSelectedFile(files[0] || null)} onError={(message) => toast({ variant: "destructive", title: "File Error", description: message })} />
              <div className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </div>
            </div>

            {loading && <UploadProgress progress={progress} message="Uploading agreement..." />}

            <Button type="submit" className="w-full" disabled={loading || !selectedFile}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Agreement
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
