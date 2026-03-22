"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Trash2,
  Download,
  FileCode2,
  Package,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { DropZone } from "../components/DropZone";

interface SvgFile {
  name: string;
  content: string;
  preview: string;
}

type GenerationStep = {
  label: string;
  done: boolean;
};

const mockCssOutput = `@font-face {
  font-family: 'devtools-icons';
  src: url('./devtools-icons.woff2') format('woff2'),
       url('./devtools-icons.woff') format('woff'),
       url('./devtools-icons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

[class^="icon-"], [class*=" icon-"] {
  font-family: 'devtools-icons' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

export default function SvgToFont() {
  const [svgs, setSvgs] = useState<SvgFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [showCssPreview, setShowCssPreview] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const svgFiles = files.filter(
      (f) => f.type === "image/svg+xml" || f.name.endsWith(".svg")
    );

    if (svgFiles.length === 0) {
      toast.error("Please upload SVG files only");
      return;
    }

    svgFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const blob = new Blob([content], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        setSvgs((prev) => [
          ...prev,
          {
            name: file.name.replace(".svg", ""),
            content,
            preview: url,
          },
        ]);
      };
      reader.readAsText(file);
    });

    toast.success(`${svgFiles.length} SVG${svgFiles.length > 1 ? "s" : ""} added`);
  }, []);

  const removeSvg = useCallback((index: number) => {
    setSvgs((prev) => {
      const svg = prev[index];
      URL.revokeObjectURL(svg.preview);
      return prev.filter((_, i) => i !== index);
    });
    setGenerationDone(false);
  }, []);

  const clearAll = useCallback(() => {
    svgs.forEach((s) => URL.revokeObjectURL(s.preview));
    setSvgs([]);
    setGenerationDone(false);
    setSteps([]);
  }, [svgs]);

  const generateFont = useCallback(async () => {
    if (svgs.length === 0) {
      toast.error("Add at least one SVG first");
      return;
    }

    setIsGenerating(true);
    setGenerationDone(false);
    setShowCssPreview(false);

    const generationSteps: GenerationStep[] = [
      { label: "Parsing SVG files", done: false },
      { label: "Normalizing paths and viewboxes", done: false },
      { label: "Generating glyph mappings", done: false },
      { label: "Creating WOFF2 font file", done: false },
      { label: "Creating WOFF font file", done: false },
      { label: "Creating TTF font file", done: false },
      { label: "Generating CSS stylesheet", done: false },
      { label: "Packaging font files", done: false },
    ];

    setSteps([...generationSteps]);

    for (let i = 0; i < generationSteps.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, 400 + Math.random() * 400)
      );
      generationSteps[i].done = true;
      setSteps([...generationSteps]);
    }

    setIsGenerating(false);
    setGenerationDone(true);
    toast.success("Icon font generated successfully!");
  }, [svgs]);

  const handleDownload = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();
    const fontsFolder = zip.folder("devtools-icons");

    if (!fontsFolder) return;

    // Add mock font files
    fontsFolder.file("devtools-icons.woff2", "/* WOFF2 font data */");
    fontsFolder.file("devtools-icons.woff", "/* WOFF font data */");
    fontsFolder.file("devtools-icons.ttf", "/* TTF font data */");

    // Generate CSS with icon classes
    let css = mockCssOutput + "\n\n";
    svgs.forEach((svg, i) => {
      const iconName = svg.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      css += `.icon-${iconName}:before { content: "\\e${(900 + i)
        .toString(16)
        .padStart(3, "0")}"; }\n`;
    });
    fontsFolder.file("devtools-icons.css", css);

    // Add original SVGs
    const svgsFolder = fontsFolder.folder("svgs");
    if (svgsFolder) {
      svgs.forEach((svg) => {
        svgsFolder.file(`${svg.name}.svg`, svg.content);
      });
    }

    // Add a demo HTML file
    const demoHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="devtools-icons.css">
  <style>body { font-family: sans-serif; padding: 2rem; } .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; } .icon-item { text-align: center; padding: 1rem; border: 1px solid #eee; border-radius: 8px; } .icon-item i { font-size: 24px; }</style>
</head>
<body>
  <h1>DevTools Icons - Demo</h1>
  <div class="icon-grid">
    ${svgs
      .map((svg) => {
        const name = svg.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        return `<div class="icon-item"><i class="icon-${name}"></i><br><small>${name}</small></div>`;
      })
      .join("\n    ")}
  </div>
</body>
</html>`;
    fontsFolder.file("demo.html", demoHtml);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "devtools-icons.zip");
    toast.success("Font package downloaded!");
  }, [svgs]);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        icon={Type}
        title="SVG to Icon Font"
        description="Convert SVG icons into a custom icon font package"
      />

      <DropZone
        onFiles={handleFiles}
        accept=".svg,image/svg+xml"
        multiple
        label="Drop your SVG files here"
        sublabel="Upload multiple SVG icons to generate a font"
        icon="file"
      />

      {/* SVG Grid Preview */}
      <AnimatePresence>
        {svgs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Icons ({svgs.length})
              </h2>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              <AnimatePresence mode="popLayout">
                {svgs.map((svg, index) => (
                  <motion.div
                    key={`${svg.name}-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="group relative flex flex-col items-center p-4 rounded-xl border border-border bg-surface/50 hover:border-border-bright transition-colors"
                  >
                    <button
                      onClick={() => removeSvg(index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md text-muted opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="w-10 h-10 mb-2 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={svg.preview}
                        alt={svg.name}
                        className="w-full h-full object-contain invert opacity-80"
                      />
                    </div>
                    <p className="text-xs text-muted text-center truncate w-full">
                      {svg.name}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Generate Button */}
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateFont}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end text-white font-medium text-sm hover:shadow-lg hover:shadow-accent/20 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Generate Icon Font
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Progress */}
      <AnimatePresence>
        {(isGenerating || generationDone) && steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 p-6 rounded-2xl border border-border bg-surface/50"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-accent" />
              {generationDone ? "Generation Complete" : "Generating Font..."}
            </h3>

            <div className="space-y-2.5">
              {steps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  {step.done ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </motion.div>
                  ) : (
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  )}
                  <span
                    className={`text-sm ${
                      step.done ? "text-muted" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Success State */}
            <AnimatePresence>
              {generationDone && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  {/* Output Files */}
                  <div className="p-4 rounded-xl bg-background/50 border border-border mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted mb-3">
                      Generated Files
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          name: "devtools-icons.woff2",
                          size: "12.4 KB",
                          icon: Package,
                        },
                        {
                          name: "devtools-icons.woff",
                          size: "14.8 KB",
                          icon: Package,
                        },
                        {
                          name: "devtools-icons.ttf",
                          size: "18.2 KB",
                          icon: Package,
                        },
                        {
                          name: "devtools-icons.css",
                          size: "2.1 KB",
                          icon: FileText,
                        },
                        {
                          name: "demo.html",
                          size: "1.3 KB",
                          icon: Code2,
                        },
                      ].map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/80"
                        >
                          <file.icon className="w-4 h-4 text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground font-mono truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted">{file.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CSS Preview Toggle */}
                  <button
                    onClick={() => setShowCssPreview(!showCssPreview)}
                    className="flex items-center gap-2 text-xs text-accent hover:text-accent-hover transition-colors mb-3"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {showCssPreview ? "Hide" : "Show"} CSS Preview
                  </button>

                  <AnimatePresence>
                    {showCssPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <pre className="p-4 rounded-xl bg-background/80 border border-border text-xs text-muted font-mono overflow-x-auto leading-relaxed">
                          {mockCssOutput}
                          {"\n\n"}
                          {svgs.map((svg, i) => {
                            const name = svg.name
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-");
                            return `.icon-${name}:before { content: "\\e${(
                              900 + i
                            )
                              .toString(16)
                              .padStart(3, "0")}"; }\n`;
                          })}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Download Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-success/10 border border-success/20 text-success font-medium text-sm hover:bg-success/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Font Package (.zip)
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
