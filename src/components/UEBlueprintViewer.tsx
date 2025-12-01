import { useEffect, useRef, useState } from "react";
import "ueblueprint/dist/css/ueb-style.min.css";
import { cn } from "@/lib/utils";
import { Code2, LayoutGrid } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UEBlueprintViewerProps {
  blueprintText: string;
  onBlueprintChange?: (text: string) => void;
}

export function UEBlueprintViewer({ blueprintText, onBlueprintChange }: UEBlueprintViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<HTMLElement | null>(null);
  const lastPushedText = useRef(blueprintText);
  const isInternalUpdate = useRef(false);
  const [height, setHeight] = useState("100vh");
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    // Dynamically import ueblueprint to ensure it registers the custom element
    import("ueblueprint").catch(console.error);
  }, []);

  useEffect(() => {
    if (showCode) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          const newHeight = `${rect.height}px`;
          setHeight(newHeight);
          if (blueprintRef.current) {
            blueprintRef.current.style.setProperty('--ueb-height', newHeight);
          }
        }
      }
    };

    updateHeight();
    
    // Use ResizeObserver for more robust size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [showCode]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // If we are in code view, we don't need to update the visual blueprint immediately
    // It will be updated when we switch back to visual view
    if (showCode) return;

    // If the update came from the visual editor itself, don't recreate the DOM
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      lastPushedText.current = blueprintText;
      return;
    }

    // If the text hasn't changed significantly (or matches what we last pushed), don't recreate
    if (blueprintText === lastPushedText.current && containerRef.current.firstElementChild) return;

    let observer: MutationObserver | null = null;

    // Debounce visual updates to prevent freezing during streaming
    const timeoutId = setTimeout(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        
        // Use innerHTML to create the element declaratively, avoiding createElement restrictions
        // and ensuring correct initialization.
        // We escape the closing template tag just in case, though T3D shouldn't have it.
        const safeBlueprintText = blueprintText ? blueprintText.replace(/<\/template>/gi, "<\\/template>") : "";

        container.innerHTML = `
          <ueb-blueprint style="--ueb-height: ${height}; width: 100%; height: 100%; display: block;">
            <template>
              ${safeBlueprintText}
            </template>
          </ueb-blueprint>
        `;
        
        const blueprint = container.firstElementChild as HTMLElement;
        blueprintRef.current = blueprint;
        lastPushedText.current = blueprintText;

        // Setup sync from Blueprint to Code
        // We use a MutationObserver to detect changes in the blueprint DOM
        observer = new MutationObserver(() => {
          try {
            // @ts-expect-error - accessing internal entity
            const entity = blueprint.entity;
            
            // Only attempt sync if we have an entity and callback
            if (entity && onBlueprintChange) {
               let text = "";
               try {
                 text = entity.toString();
               } catch (e) {
                 console.error("Failed to serialize blueprint:", e);
               }

               // Only update if text is different and valid
               // We explicitly check for "[object Object]" because the library might return that if toString is not implemented correctly
               if (text && text.length > 0 && text !== "[object Object]" && text !== blueprintText) {
                   isInternalUpdate.current = true;
                   onBlueprintChange(text);
               }
            }
          } catch (e) {
            // Silent fail if serialization fails
          }
        });
        
        observer.observe(blueprint, { 
          subtree: true, 
          childList: true, 
          attributes: true, 
          characterData: true 
        });

    }, 100); // 100ms debounce

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      blueprintRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintText, height, showCode]); 

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Professional Toolbar */}
      <header className="h-11 border-b border-border/60 bg-card/95 backdrop-blur-sm flex items-center px-3 shrink-0 z-10">
        {/* View Toggle Group */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/40">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowCode(false)}
                className={cn(
                  "toolbar-button",
                  !showCode && "toolbar-button-active"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Visual View
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowCode(true)}
                className={cn(
                  "toolbar-button",
                  showCode && "toolbar-button-active"
                )}
              >
                <Code2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Code View
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          <SettingsDialog />
        </div>
      </header>

      <div className="flex-1 relative min-h-0">
        {showCode && (
          <div className={cn("absolute inset-0 bg-muted/30 z-10", onBlueprintChange ? "overflow-hidden" : "overflow-auto scrollbar-thin")}>
            {onBlueprintChange ? (
              <textarea
                className="w-full h-full bg-card text-foreground font-mono text-xs p-4 resize-none focus:outline-none border-none scrollbar-thin overflow-auto"
                value={blueprintText}
                onChange={(e) => onBlueprintChange(e.target.value)}
                placeholder="// Paste your UE5 blueprint T3D code here... or create nodes in the visual view."
                spellCheck={false}
              />
            ) : (
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all text-foreground/80">
                {blueprintText || "No blueprint content"}
              </pre>
            )}
          </div>
        )}
        <div 
          ref={containerRef} 
          className={cn("w-full h-full", showCode && "hidden")}
        />
      </div>
    </div>
  );
}
