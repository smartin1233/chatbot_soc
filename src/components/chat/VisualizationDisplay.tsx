// src/components/chat/VisualizationDisplay.tsx
"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VisualizationData {
type: string;
data: any;
config?: any;
}

interface VisualizationDisplayProps {
visualization: VisualizationData;
title?: string;
explanation?: string;
}

export function VisualizationDisplay({
visualization,
title = "Visualization",
explanation
}: VisualizationDisplayProps) {
const plotRef = useRef<HTMLDivElement>(null);

useEffect(() => {
if (plotRef.current && typeof window !== "undefined") {
// Dynamically import Plotly to avoid SSR issues
import("plotly.js-dist-min").then((Plotly) => {
if (plotRef.current) {
// Clear any existing plot
Plotly.purge(plotRef.current);

// Create the new plot
Plotly.newPlot(
plotRef.current,
visualization.data,
visualization.config || {
responsive: true,
displayModeBar: true,
displaylogo: false,
modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
}
);
}
});
}

// Cleanup function
return () => {
if (plotRef.current && typeof window !== "undefined") {
import("plotly.js-dist-min").then((Plotly) => {
if (plotRef.current) {
Plotly.purge(plotRef.current);
}
});
}
};
}, [visualization]);

return (
<Card>
<CardHeader>
<CardTitle>{title}</CardTitle>
{explanation &&
<p className="text-sm text-muted-foreground">{explanation}</p>
}
</CardHeader>
<CardContent>
<div ref={plotRef} style={{ width: "100%", height: "400px" }} />
</CardContent>
</Card>
);
}
