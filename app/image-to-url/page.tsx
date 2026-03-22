"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Copy,
  Check,
  Trash2,
  Link2,
  RotateCw,
  ExternalLink,
  Upload,
  CloudUpload,
  Shield,
  Globe,
  Code,
  FileCode,
  Hash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { DropZone } from "../components/DropZone";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  filename: string | null;
  progress: number;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
}

type CopyFormat = "url" | "html" | "css" | "markdown";

export default function ImageToUrl() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [copiedState, setCopiedState] = useState<{
    id: string;
    format: CopyFormat;
  } | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadImage = useCallback(async (file: File, id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, progress: 5, status: "uploading" as const }
          : img
      )
    );

    // Simulated progress while waiting for actual upload
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 6 + 2;
      if (currentProgress > 75) currentProgress = 75;
      setImages((prev) =>
        prev.map((img) =>
          img.id === id && img.status === "uploading"
            ? { ...img, progress: currentProgress }
            : img
        )
      );
    }, 180);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      // Jump to 90%
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, progress: 90 } : img
        )
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(
          errorData.error || `Upload failed (HTTP ${response.status})`
        );
      }

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || "Server returned an invalid response.");
      }

      // Complete
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                progress: 100,
                status: "done" as const,
                url: data.url,
                filename: data.filename || null,
              }
            : img
        )
      );

      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      clearInterval(progressInterval);
      const message =
        error instanceof Error ? error.message : "Upload failed";

      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                status: "error" as const,
                errorMessage: message,
                progress: 0,
              }
            : img
        )
      );

      toast.error(`Failed: ${file.name}`);
    }
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "uploading" as const,
                  progress: 0,
                  errorMessage: undefined,
                  url: null,
                  filename: null,
                }
              : i
          )
        );
        uploadImage(img.file, id);
      }
    },
    [images, uploadImage]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const rejected = files.length - imageFiles.length;

      if (rejected > 0) {
        toast.error(
          `${rejected} file${rejected > 1 ? "s" : ""} skipped (not an image)`
        );
      }

      imageFiles.forEach((file) => {
        const preview = URL.createObjectURL(file);
        const id = crypto.randomUUID();
        const newImage: UploadedImage = {
          id,
          file,
          preview,
          url: null,
          filename: null,
          progress: 0,
          status: "uploading",
        };

        setImages((prev) => {
          setTimeout(() => uploadImage(file, id), 50);
          return [...prev, newImage];
        });
      });
    },
    [uploadImage]
  );

  const copyToClipboard = useCallback(
    (text: string, id: string, format: CopyFormat, label: string) => {
      navigator.clipboard.writeText(text);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedState({ id, format });
      toast.success(`${label} copied!`);
      copyTimeoutRef.current = setTimeout(
        () => setCopiedState(null),
        2000
      );
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    toast.success("All cleared");
  }, [images]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isCopied = (id: string, format: CopyFormat) =>
    copiedState?.id === id && copiedState?.format === format;

  const doneCount = images.filter((i) => i.status === "done").length;
  const errorCount = images.filter((i) => i.status === "error").length;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        icon={Image}
        title="Image to URL"
        description="Upload images to cloud storage and get permanent, shareable URLs"
      />

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3 px-4 py-3 mb-6 rounded-xl border border-accent/20 bg-accent-dim"
      >
        <CloudUpload className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium">
            Cloudflare R2 Cloud Storage
          </p>
          <p className="text-xs text-muted mt-0.5">
            Images are uploaded to Cloudflare R2 and served via a permanent URL.
            No Base64 encoding — you get a real, shareable image link.
          </p>
        </div>
      </motion.div>

      {/* Features Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {[
          {
            icon: Globe,
            label: "Permanent URL",
            desc: "Accessible anywhere",
          },
          {
            icon: Shield,
            label: "Max 10 MB",
            desc: "PNG, JPG, GIF, WebP, SVG",
          },
          {
            icon: Link2,
            label: "Direct Link",
            desc: "No redirects or wrappers",
          },
        ].map((feat) => (
          <div
            key={feat.label}
            className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border border-border bg-surface/40"
          >
            <feat.icon className="w-4 h-4 text-accent" />
            <p className="text-xs font-medium text-foreground">{feat.label}</p>
            <p className="text-[10px] text-muted leading-tight">{feat.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Drop Zone */}
      <DropZone
        onFiles={handleFiles}
        accept="image/*"
        multiple
        label="Drop your images here"
        sublabel="PNG, JPG, GIF, SVG, WebP, AVIF — up to 10 MB each"
        icon="image"
      />

      {/* Results */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Uploaded Images
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {doneCount} of {images.length} uploaded
                  {errorCount > 0 && (
                    <span className="text-error">
                      {" "}
                      · {errorCount} failed
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>

            {/* Image Cards */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="relative rounded-xl border border-border bg-surface/50 overflow-hidden"
                  >
                    {/* Progress bar at bottom */}
                    {img.status === "uploading" && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-accent-hover"
                        initial={{ width: "0%" }}
                        animate={{ width: `${img.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    {img.status === "error" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-error/50" />
                    )}
                    {img.status === "done" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-success/30" />
                    )}

                    <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
                      {/* Image Preview */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.preview}
                          alt={img.file.name}
                          className="w-full h-full object-cover"
                        />
                        {img.status === "uploading" && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <RotateCw className="w-5 h-5 text-accent" />
                            </motion.div>
                          </div>
                        )}
                        {img.status === "done" && (
                          <div className="absolute bottom-0 right-0 m-1">
                            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        {img.status === "error" && (
                          <div className="absolute inset-0 bg-error/20 flex items-center justify-center">
                            <X className="w-5 h-5 text-error" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 w-full">
                        {/* File info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {img.file.name}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              {formatSize(img.file.size)}
                              {img.file.type &&
                                ` · ${img.file.type.split("/")[1]?.toUpperCase()}`}
                            </p>
                          </div>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Uploading State */}
                        {img.status === "uploading" && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted mb-1.5">
                              <span className="flex items-center gap-1.5">
                                <Upload className="w-3 h-3" />
                                Uploading to Cloudflare R2...
                              </span>
                              <span className="font-mono tabular-nums">
                                {Math.round(img.progress)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${img.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Error State */}
                        {img.status === "error" && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-error">
                              {img.errorMessage || "Upload failed"}
                            </p>
                            <button
                              onClick={() => retryUpload(img.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-error/10 text-error hover:bg-error/20 border border-error/20 transition-colors"
                            >
                              <RotateCw className="w-3 h-3" />
                              Retry Upload
                            </button>
                          </div>
                        )}

                        {/* Done State — Full URL display */}
                        {img.status === "done" && img.url && (
                          <div className="mt-3 space-y-3">
                            {/* URL Field */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border font-mono text-xs text-foreground overflow-hidden">
                                <Globe className="w-3.5 h-3.5 shrink-0 text-success" />
                                <span className="truncate select-all">
                                  {img.url}
                                </span>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  copyToClipboard(
                                    img.url!,
                                    img.id,
                                    "url",
                                    "Image URL"
                                  )
                                }
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                                  isCopied(img.id, "url")
                                    ? "bg-success/15 text-success border border-success/30"
                                    : "bg-accent text-white hover:bg-accent-hover"
                                }`}
                              >
                                {isCopied(img.id, "url") ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy URL
                                  </>
                                )}
                              </motion.button>
                            </div>

                            {/* Quick Copy Formats */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
                                Copy as:
                              </span>

                              {/* HTML */}
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `<img src="${img.url}" alt="${img.file.name}" />`,
                                    img.id,
                                    "html",
                                    "HTML"
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  isCopied(img.id, "html")
                                    ? "bg-success/10 text-success border-success/20"
                                    : "text-muted hover:text-accent bg-surface-hover hover:bg-accent-dim border-border"
                                }`}
                              >
                                <Code className="w-3 h-3" />
                                {isCopied(img.id, "html") ? "Copied!" : "HTML"}
                              </button>

                              {/* CSS */}
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `background-image: url("${img.url}");`,
                                    img.id,
                                    "css",
                                    "CSS"
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  isCopied(img.id, "css")
                                    ? "bg-success/10 text-success border-success/20"
                                    : "text-muted hover:text-accent bg-surface-hover hover:bg-accent-dim border-border"
                                }`}
                              >
                                <Hash className="w-3 h-3" />
                                {isCopied(img.id, "css") ? "Copied!" : "CSS"}
                              </button>

                              {/* Markdown */}
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `![${img.file.name}](${img.url})`,
                                    img.id,
                                    "markdown",
                                    "Markdown"
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  isCopied(img.id, "markdown")
                                    ? "bg-success/10 text-success border-success/20"
                                    : "text-muted hover:text-accent bg-surface-hover hover:bg-accent-dim border-border"
                                }`}
                              >
                                <FileCode className="w-3 h-3" />
                                {isCopied(img.id, "markdown")
                                  ? "Copied!"
                                  : "Markdown"}
                              </button>

                              {/* Divider */}
                              <div className="h-4 w-px bg-border" />

                              {/* Open in New Tab */}
                              <a
                                href={img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted hover:text-accent bg-surface-hover hover:bg-accent-dim border border-border transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
