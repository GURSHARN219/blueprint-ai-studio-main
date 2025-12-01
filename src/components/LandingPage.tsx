import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onStart: (prompt: string) => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (prompt.trim()) {
      onStart(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerate();
    }
  };

  const suggestions = [
    { label: "Flashlight System", prompt: "Create a flashlight system that can be toggled with F key and drains battery over time" },
    { label: "Health Regen", prompt: "Create a health regeneration system that starts after 5 seconds of no damage" },
    { label: "Double Jump", prompt: "Create a double jump system that resets on landing" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      {/* <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="font-bold text-white text-sm">BP</span>
        </div>
        <span className="font-semibold text-white">UE5 Blueprint Studio</span>
      </div> */}

      {/* Main Content */}
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-8 z-10 animate-fade-up">
        <img src="/logo.png" alt="UE5 Blueprint Studio" className="w-32 h-32 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            AI-Powered <br />
            <span className="text-blue-500">Blueprint Editor</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Analyze, debug, and create blueprints with AI assistance. Copy and paste blueprints from UE5.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative flex items-center bg-[#111] rounded-xl border border-white/10 p-2 pl-4">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Create a double jump system that resets on landing..."
                className="border-none bg-transparent text-lg h-12 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              <Button 
                onClick={handleGenerate}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all"
              >
                Generate Blueprint
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
            <span>Try:</span>
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => onStart(s.prompt)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
