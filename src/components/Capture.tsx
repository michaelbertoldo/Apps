"use client";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui";
import type { AnalyzeResponse } from "@/lib/schema";

type Props = { onResultAction: (data: AnalyzeResponse) => void };

export function Capture({ onResultAction }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
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
      onResultAction(j as AnalyzeResponse);
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function openCamera() {
    try {
      const s = await startStream("environment");
      setStream(s);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch {
      alert("Unable to access camera. Please allow permissions.");
    }
  }

  function stopCamera() {
    setShowCamera(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(f);
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden camera input to trigger native camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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
      {showCamera ? (
        <div className="flex flex-col gap-2">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" />
          <div className="flex items-center gap-2">
            <Button type="button" onClick={captureFrame}>Capture</Button>
            <Button type="button" onClick={stopCamera}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button type="button" onClick={openCamera}>Take Photo</Button>
          <Button type="button" onClick={() => cameraInputRef.current?.click()}>Upload</Button>
          <span className="text-xs text-gray-600">Use camera or upload from library</span>
        </div>
      )}
      <Button disabled={!file || loading} onClick={analyze}>{loading ? "Analyzing…" : "Analyze"}</Button>
    </div>
  );
}

async function startStream(facing: "user" | "environment" = "environment") {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
}



