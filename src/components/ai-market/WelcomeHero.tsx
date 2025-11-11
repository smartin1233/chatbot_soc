// src/components/ai-market/WelcomeHero.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function WelcomeHero() {
return (
<section className="text-center py-12 bg-muted rounded-lg">
<h1 className="text-4xl font-bold mb-4">
AI Agent Marketplace
</h1>
<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
Discover and explore specialized AI agents to enhance your business operations and decision-making processes.
</p>
<div className="space-x-4">
<Button asChild>
<Link href="/chat">Get Started</Link>
</Button>
<Button variant="outline" asChild>
<Link href="/docs">Learn More</Link>
</Button>
</div>
</section>
);
}
