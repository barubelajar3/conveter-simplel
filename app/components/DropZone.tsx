"use client";

import { motion } from "framer-motion";
import { Upload, FileImage } from "lucide-react";
import { useCallback, useState, type DragEvent } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label: string;
  sublabel: string;
  icon?: "image" | "file";
}

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  label,
  sublabel,
  icon = "image",
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFiles(multiple ? files : [files[0]]);
      }
    },
    [onFiles, multiple]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => {
      if (input.files) {
        onFiles(Array.from(input.files));
      }
    };
    input.click();
  }, [accept, multiple, onFiles]);

  const IconComp = icon === "image" ? FileImage : Upload;

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
        isDragging
          ? "border-accent bg-accent-dim scale-[1.01]"
          : "border-border-bright hover:border-accent/50 hover:bg-accent-dim/50"
      }`}
    >
      {/* Gradient glow behind icon */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full transition-opacity duration-300 ${
          isDragging ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      <motion.div
        animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative z-10"
      >
        <div className="flex justify-center mb-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-colors duration-300 ${
              isDragging
                ? "bg-accent/20 text-accent"
                : "bg-surface-hover text-muted"
            }`}
          >
            <IconComp className="w-8 h-8" />
          </div>
        </div>
        <p className="text-base font-medium text-foreground mb-1">{label}</p>
        <p className="text-sm text-muted">{sublabel}</p>
      </motion.div>
    </motion.div>
  );
}
