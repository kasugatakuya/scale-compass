import { Suspense } from "react";
import { ScaleTool } from "@/components/tool/ScaleTool";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中…</p>}>
      <ScaleTool />
    </Suspense>
  );
}
