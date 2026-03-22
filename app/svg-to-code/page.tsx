"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  Check,
  FileCode,
  Link2,
  Braces,
  Trash2,
  Upload,
  ClipboardPaste,
  FileImage,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

type TabId = "minified" | "datauri" | "jsx";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Code2;
  description: string;
}

const tabs: TabDef[] = [
  {
    id: "minified",
    label: "Minified SVG",
    icon: FileCode,
    description: "Optimized & minified SVG code",
  },
  {
    id: "datauri",
    label: "Data URI",
    icon: Link2,
    description: "Base64 encoded for CSS/HTML",
  },
  {
    id: "jsx",
    label: "JSX Component",
    icon: Braces,
    description: "React JSX/TSX component",
  },
];

function minifySVG(svg: string): string {
  let result = svg.trim();
  // Remove XML declaration
  result = result.replace(/<\?xml[^?]*\?>\s*/gi, "");
  // Remove comments
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  // Remove doctype
  result = result.replace(/<!DOCTYPE[^>]*>/gi, "");
  // Remove metadata, title, desc tags and their content
  result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  result = result.replace(/<title[\s\S]*?<\/title>/gi, "");
  result = result.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  // Remove empty defs
  result = result.replace(/<defs\s*\/>/gi, "");
  result = result.replace(/<defs>\s*<\/defs>/gi, "");
  // Remove editor-specific attributes
  result = result.replace(
    /\s+(xmlns:(?:xlink|dc|cc|rdf|svg|sodipodi|inkscape)|inkscape:[a-z-]+|sodipodi:[a-z-]+|data-name)="[^"]*"/gi,
    ""
  );
  // Remove empty groups
  result = result.replace(/<g>\s*<\/g>/gi, "");
  // Collapse whitespace between tags
  result = result.replace(/>\s+</g, "><");
  // Collapse multiple spaces in attributes
  result = result.replace(/\s{2,}/g, " ");
  // Trim spaces before closing bracket
  result = result.replace(/\s+>/g, ">");
  result = result.replace(/\s+\/>/g, "/>");
  return result.trim();
}

function svgToBase64DataURI(svg: string): string {
  const minified = minifySVG(svg);
  const encoded = btoa(unescape(encodeURIComponent(minified)));
  return `data:image/svg+xml;base64,${encoded}`;
}

function svgToJSX(svg: string): string {
  let jsx = minifySVG(svg);

  // Extract viewBox or dimensions for the component props
  const viewBoxMatch = jsx.match(/viewBox="([^"]*)"/);
  const widthMatch = jsx.match(/\bwidth="([^"]*)"/);
  const heightMatch = jsx.match(/\bheight="([^"]*)"/);

  // Convert SVG attributes to JSX-compatible camelCase
  const attrMap: Record<string, string> = {
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-weight": "fontWeight",
    "letter-spacing": "letterSpacing",
    "line-height": "lineHeight",
    "marker-end": "markerEnd",
    "marker-mid": "markerMid",
    "marker-start": "markerStart",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    "text-anchor": "textAnchor",
    "text-decoration": "textDecoration",
    "word-spacing": "wordSpacing",
    "writing-mode": "writingMode",
    "dominant-baseline": "dominantBaseline",
    "alignment-baseline": "alignmentBaseline",
    "baseline-shift": "baselineShift",
    "color-interpolation": "colorInterpolation",
    "color-interpolation-filters": "colorInterpolationFilters",
    "flood-color": "floodColor",
    "flood-opacity": "floodOpacity",
    "lighting-color": "lightingColor",
    "shape-rendering": "shapeRendering",
    "image-rendering": "imageRendering",
    "pointer-events": "pointerEvents",
    "paint-order": "paintOrder",
    "vector-effect": "vectorEffect",
    "xlink:href": "xlinkHref",
    "xlink:title": "xlinkTitle",
    "xlink:show": "xlinkShow",
    "xlink:type": "xlinkType",
    "xlink:role": "xlinkRole",
    "xlink:arcrole": "xlinkArcrole",
    "xlink:actuate": "xlinkActuate",
    "xml:lang": "xmlLang",
    "xml:space": "xmlSpace",
    "tab-index": "tabIndex",
    "color-profile": "colorProfile",
    "glyph-ref": "glyphRef",
    "glyph-orientation-horizontal": "glyphOrientationHorizontal",
    "glyph-orientation-vertical": "glyphOrientationVertical",
    "horiz-adv-x": "horizAdvX",
    "horiz-origin-x": "horizOriginX",
    "vert-adv-y": "vertAdvY",
    "vert-origin-y": "vertOriginY",
    "panose-1": "panose1",
    "font-style": "fontStyle",
    "font-variant": "fontVariant",
    "font-stretch": "fontStretch",
    "text-rendering": "textRendering",
    "underline-position": "underlinePosition",
    "underline-thickness": "underlineThickness",
    "overline-position": "overlinePosition",
    "overline-thickness": "overlineThickness",
    "strikethrough-position": "strikethroughPosition",
    "strikethrough-thickness": "strikethroughThickness",
    xmlns: null as unknown as string,
    "xmlns:xlink": null as unknown as string,
    "xmlns:svg": null as unknown as string,
  };

  // Replace hyphenated attributes
  for (const [attr, jsxAttr] of Object.entries(attrMap)) {
    if (jsxAttr === null) {
      // Remove xmlns attributes
      const regex = new RegExp(`\\s*${attr.replace(":", "\\:")}="[^"]*"`, "g");
      jsx = jsx.replace(regex, "");
    } else {
      const regex = new RegExp(`\\b${attr}=`, "g");
      jsx = jsx.replace(regex, `${jsxAttr}=`);
    }
  }

  // Convert class to className
  jsx = jsx.replace(/\bclass="/g, 'className="');

  // Convert inline style strings to JSX style objects
  jsx = jsx.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
    const styles = styleStr
      .split(";")
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const [prop, val] = s.split(":").map((p: string) => p.trim());
        const camelProp = prop.replace(/-([a-z])/g, (_: string, c: string) =>
          c.toUpperCase()
        );
        return `${camelProp}: "${val}"`;
      });
    return `style={{${styles.join(", ")}}}`;
  });

  // Replace width/height on root SVG with props spread
  jsx = jsx.replace(
    /^(<svg)/,
    "$1"
  );

  // Format JSX for readability
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
  const width = widthMatch ? widthMatch[1] : "24";
  const height = heightMatch ? heightMatch[1] : "24";

  // Remove fixed width/height from the SVG tag to make it prop-driven
  jsx = jsx.replace(/\s*\bwidth="[^"]*"/, "");
  jsx = jsx.replace(/\s*\bheight="[^"]*"/, "");

  // Ensure there's a viewBox
  if (!viewBoxMatch) {
    jsx = jsx.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`);
  }

  // Add {...props} to the SVG tag
  jsx = jsx.replace("<svg", "<svg {...props}");

  // Pretty-print: add newlines before major elements
  jsx = jsx.replace(/></g, ">\n      <");
  // Fix closing tags
  jsx = jsx.replace(/<\/svg>/g, "\n    </svg>");

  const component = `import type { SVGProps } from "react";

interface SvgIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function SvgIcon({ size = ${width}, ...props }: SvgIconProps) {
  return (
    ${jsx.replace("<svg", `<svg\n      width={size}\n      height={size}`)}
  );
}`;

  return component;
}

function SVGPreview({ svgCode }: { svgCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && svgCode) {
      containerRef.current.innerHTML = svgCode;
      const svg = containerRef.current.querySelector("svg");
      if (svg) {
        svg.style.maxWidth = "100%";
        svg.style.maxHeight = "100%";
        svg.style.width = "auto";
        svg.style.height = "auto";
        // Ensure it scales nicely
        if (!svg.getAttribute("viewBox")) {
          const w = svg.getAttribute("width") || "100";
          const h = svg.getAttribute("height") || "100";
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        }
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";
      }
    }
  }, [svgCode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
    />
  );
}

export default function SvgToCodePage() {
  const [svgInput, setSvgInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("minified");
  const [copiedTab, setCopiedTab] = useState<TabId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isValidSVG = svgInput.trim().includes("<svg");

  const outputs: Record<TabId, string> = {
    minified: isValidSVG ? minifySVG(svgInput) : "",
    datauri: isValidSVG ? svgToBase64DataURI(svgInput) : "",
    jsx: isValidSVG ? svgToJSX(svgInput) : "",
  };

  const handleCopy = useCallback(
    async (tab: TabId) => {
      const text = outputs[tab];
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedTab(tab);
        toast.success(
          `${tabs.find((t) => t.id === tab)?.label} copied to clipboard!`
        );
        setTimeout(() => setCopiedTab(null), 2000);
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    },
    [outputs]
  );

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === "image/svg+xml" || file.name.endsWith(".svg"))) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setSvgInput(text);
          toast.success("SVG file loaded successfully!");
        }
      };
      reader.readAsText(file);
    } else {
      toast.error("Please drop a valid SVG file");
    }
  }, []);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result;
          if (typeof text === "string") {
            setSvgInput(text);
            toast.success("SVG file loaded successfully!");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleClear = useCallback(() => {
    setSvgInput("");
    toast("Input cleared");
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSvgInput(text);
        toast.success("Pasted from clipboard!");
      }
    } catch {
      toast.error("Failed to read clipboard. Try pasting manually with Ctrl+V.");
    }
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <PageHeader
        icon={Code2}
        title="SVG to Code"
        description="Convert raw SVG into minified code, Base64 Data URI, or React JSX components"
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm font-medium text-foreground">
                  SVG Input
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-surface-hover hover:bg-border rounded-lg transition-colors"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFileSelect}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-surface-hover hover:bg-border rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </motion.button>
                {svgInput && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-error/80 hover:text-error bg-surface-hover hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </motion.button>
                )}
              </div>
            </div>

            {/* Textarea / Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleFileDrop}
              className="relative flex-1 min-h-0"
            >
              <textarea
                ref={textareaRef}
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder={`Paste your SVG code here or drop an SVG file...

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`}
                spellCheck={false}
                className={`w-full h-full min-h-[400px] lg:min-h-[500px] rounded-2xl border-2 bg-surface/50 p-4 text-sm font-mono text-foreground placeholder:text-muted/50 resize-none focus:outline-none transition-all duration-300 ${
                  isDragging
                    ? "border-accent bg-accent-dim"
                    : "border-border hover:border-border-bright focus:border-accent/50"
                }`}
              />

              {/* Drop overlay */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-2xl bg-accent-dim/80 backdrop-blur-sm flex items-center justify-center border-2 border-accent border-dashed pointer-events-none"
                  >
                    <div className="text-center">
                      <FileImage className="w-12 h-12 text-accent mx-auto mb-2" />
                      <p className="text-sm font-medium text-accent">
                        Drop SVG file here
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SVG Preview */}
            <AnimatePresence>
              {isValidSVG && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-medium text-foreground">
                      Preview
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface/50 p-6 flex items-center justify-center h-[140px] overflow-hidden">
                    <div
                      className="w-[100px] h-[100px]"
                      style={{
                        background:
                          "repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px",
                      }}
                    >
                      <SVGPreview svgCode={svgInput} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gradient-end" />
              <span className="text-sm font-medium text-foreground">
                Output
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface/80 border border-border mb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeOutputTab"
                      className="absolute inset-0 bg-accent-dim border border-accent/20 rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <tab.icon
                    className={`relative z-10 w-4 h-4 ${
                      activeTab === tab.id ? "text-accent" : "text-muted"
                    }`}
                  />
                  <span
                    className={`relative z-10 hidden sm:inline ${
                      activeTab === tab.id ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={activeTab}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs text-muted mb-2"
              >
                {tabs.find((t) => t.id === activeTab)?.description}
              </motion.p>
            </AnimatePresence>

            {/* Output Area */}
            <div className="flex-1 relative min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {isValidSVG ? (
                    <div className="relative h-full">
                      <pre className="w-full h-full min-h-[400px] lg:min-h-[500px] rounded-2xl border border-border bg-surface/50 p-4 text-sm font-mono text-foreground overflow-auto whitespace-pre-wrap break-all">
                        {outputs[activeTab]}
                      </pre>

                      {/* Copy Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopy(activeTab)}
                        className={`absolute top-3 right-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                          copiedTab === activeTab
                            ? "bg-success/20 text-success border border-success/30"
                            : "bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {copiedTab === activeTab ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Copied!
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Code
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      {/* Size info */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-surface/80 border border-border text-xs text-muted">
                        {outputs[activeTab].length.toLocaleString()} chars
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[400px] lg:min-h-[500px] rounded-2xl border border-border bg-surface/50 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="flex justify-center mb-4">
                          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-hover">
                            <Code2 className="w-8 h-8 text-muted/50" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-muted mb-1">
                          No SVG input detected
                        </p>
                        <p className="text-xs text-muted/60">
                          Paste SVG code or drop an SVG file on the left panel
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quick copy for Data URI usage examples */}
            <AnimatePresence>
              {isValidSVG && activeTab === "datauri" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-sm font-medium text-foreground">
                      Usage Examples
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        label: "CSS background",
                        code: `background-image: url("${outputs.datauri.slice(0, 50)}...");`,
                        full: `background-image: url("${outputs.datauri}");`,
                      },
                      {
                        label: "HTML img tag",
                        code: `<img src="${outputs.datauri.slice(0, 50)}..." alt="icon" />`,
                        full: `<img src="${outputs.datauri}" alt="icon" />`,
                      },
                    ].map((example) => (
                      <div
                        key={example.label}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-4 py-2.5"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted mb-0.5">
                            {example.label}
                          </p>
                          <p className="text-xs font-mono text-foreground/70 truncate">
                            {example.code}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async () => {
                            await navigator.clipboard.writeText(example.full);
                            toast.success(`${example.label} snippet copied!`);
                          }}
                          className="shrink-0 p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-dim transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
