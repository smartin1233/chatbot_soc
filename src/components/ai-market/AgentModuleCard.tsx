// src/components/ai-market/AgentModuleCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AgentModule {
id: string;
title: string;
description: string;
icon: string;
features: string[];
}

interface AgentModuleCardProps {
module: AgentModule;
}

export function AgentModuleCard({ module }: AgentModuleCardProps) {
return (
<Card className="flex flex-col">
<CardHeader className="flex-row items-center gap-4">
<div className="text-4xl">{module.icon}</div>
<div>
<CardTitle>{module.title}</CardTitle>
<CardDescription>{module.description}</CardDescription>
</div>
</CardHeader>
<CardContent className="flex-grow">
<ul className="space-y-2 text-sm text-muted-foreground">
{module.features.map((feature, index) => (
<li key={index} className="flex items-center gap-2">
<span className="text-primary">✓</span>
<span>{feature}</span>
</li>
))}
</ul>
</CardContent>
<div className="p-6 pt-0">
<Button asChild className="w-full">
<Link href={`/chat?agent=${module.id}`}>Activate</Link>
</Button>
</div>
</Card>
);
}
