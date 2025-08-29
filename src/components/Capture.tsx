"use client";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Input } from "@/components/ui";
import type { AnalyzeResponse } from "@/lib/schema";

type Props = { onResult: (data: AnalyzeResponse) => void };

export function Capture({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxSize: 8 * 1024 * 1024,
    onDropAccepted(files) { setFile(files[0]); },
  });

  async function analyze() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const r = await fetch("/api/analyze", { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed");
      onResult(j as AnalyzeResponse);
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden camera input to trigger native camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0] || null;
          if (f) setFile(f);
          e.currentTarget.value = "";
        }}
      />

      <div {...getRootProps()} className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center ${isDragActive ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:bg-gray-50"}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-gray-600">Drag & drop a photo of your food, or click to select</p>
        {file && <div className="text-xs text-gray-700">{file.name} ({Math.round(file.size/1024)} KB)</div>}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => cameraInputRef.current?.click()}>Take Photo</Button>
        <span className="text-xs text-gray-600">Opens your device camera</span>
      </div>
      <Button disabled={!file || loading} onClick={analyze}>{loading ? "Analyzing…" : "Analyze"}</Button>
    </div>
  );
}


