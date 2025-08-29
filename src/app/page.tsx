"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Capture } from "@/components/Capture";
import { useState } from "react";
import type { AnalyzeResponse } from "@/lib/schema";

export default function Home() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Food Vision</h1>
      <Tabs.Root defaultValue="capture" className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
        </TabsList>
        <TabsContent value="capture">
          <Capture onResult={setResult} />
        </TabsContent>
        <TabsContent value="recipes">
          {!result ? (
            <div className="text-sm text-gray-600">No results yet. Capture a photo first.</div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium">Detected Items</div>
                <ul className="list-disc pl-4 text-sm">
                  {result.detectedItems.map((i, idx) => (
                    <li key={idx}>{i.name}{i.quantity ? ` — ${i.quantity}` : ""}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Expiration</div>
                <ul className="list-disc pl-4 text-sm">
                  {result.expirationEstimates.map((e, idx) => (
                    <li key={idx}>{e.item}: {e.daysUntilExpiry} days</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Recipe Ideas</div>
                <div className="grid gap-3">
                  {result.recipes.map((r, idx) => (
                    <div key={idx} className="rounded-xl border p-4">
                      <div className="font-medium">{r.title}</div>
                      {r.estimatedTimeMinutes ? <div className="text-xs text-gray-600">~{r.estimatedTimeMinutes} min</div> : null}
                      <div className="mt-2 text-sm"><span className="font-medium">Ingredients:</span> {r.ingredients.join(", ")}</div>
                      <ol className="mt-2 list-decimal pl-4 text-sm">
                        {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs.Root>
    </div>
  );
}
