import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MinimalChatPanel } from "@/components/MinimalChatPanel";
import { UEBlueprintViewer } from "@/components/UEBlueprintViewer";
import { LandingPage } from "@/components/LandingPage";

// Sample blueprint to show on load
const SAMPLE_BLUEPRINT = `Begin Object Class=/Script/BlueprintGraph.K2Node_Event Name="K2Node_Event_0"
   EventReference=(MemberParent=Class'/Script/Engine.Actor',MemberName="ReceiveBeginPlay")
   bOverrideFunction=True
   NodePosX=0
   NodePosY=0
   NodeGuid=A9977891460594F74765329841079555
   CustomProperties Pin (PinId=75816912443493465133619572620163,PinName="OutputDelegate",Direction="EGPD_Output",PinType.PinCategory="delegate",PinType.PinSubCategory="",PinType.PinSubCategoryObject=None,PinType.PinSubCategoryMemberReference=(MemberParent=Class'/Script/Engine.Actor',MemberName="ReceiveBeginPlay"),PinType.PinValueType=(),PinType.ContainerType=None,PinType.bIsReference=False,PinType.bIsConst=False,PinType.bIsWeakPointer=False,PinType.bIsUObjectWrapper=False,PinType.bSerializeAsSinglePrecisionFloat=False,LinkedTo=(K2Node_CallFunction_0 96259025424911781256338309605796,))
   CustomProperties Pin (PinId=55610850495817811267819126487192,PinName="then",Direction="EGPD_Output",PinType.PinCategory="exec",PinType.PinSubCategory="",PinType.PinSubCategoryObject=None,PinType.PinSubCategoryMemberReference=(),PinType.PinValueType=(),PinType.ContainerType=None,PinType.bIsReference=False,PinType.bIsConst=False,PinType.bIsWeakPointer=False,PinType.bIsUObjectWrapper=False,PinType.bSerializeAsSinglePrecisionFloat=False,LinkedTo=(K2Node_CallFunction_0 54181669430335010901519782433842,))
End Object`;

const Index = () => {
  const [blueprintText, setBlueprintText] = useState(SAMPLE_BLUEPRINT);
  const [showLanding, setShowLanding] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState("");

  const handleStart = (prompt: string) => {
    setInitialPrompt(prompt);
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* AI Panel */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={45}>
            <MinimalChatPanel
              blueprintText={blueprintText}
              onBlueprintGenerated={setBlueprintText}
              initialPrompt={initialPrompt}
            />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-border/40 hover:bg-primary/50 transition-colors data-[resize-handle-active]:bg-primary" />

            {/* Blueprint Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="relative h-full w-full overflow-hidden bg-[#1a1a1a]">
                <UEBlueprintViewer 
                  blueprintText={blueprintText} 
                  onBlueprintChange={setBlueprintText}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
  );
};

export default Index;