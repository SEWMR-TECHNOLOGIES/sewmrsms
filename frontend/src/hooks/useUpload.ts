import { useState } from "react";

export function useUpload() {
  const [progress, setProgress] = useState(0);

  const uploadFile = (url: string, file: File, fieldName = "file") => {
    return new Promise<Response>((resolve, reject) => {
      const fd = new FormData();
      fd.append(fieldName, file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setProgress(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        } else {
          reject(new Error(xhr.statusText || "Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(fd);
    });
  };

  const resetProgress = () => setProgress(0);

  return { progress, uploadFile, resetProgress };
}
