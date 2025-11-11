// src/app/ai-market/page.tsx
import { Metadata } from "next";
import { WelcomeHero } from "@/components/ai-market/WelcomeHero";
import { AgentModuleCard } from "@/components/ai-market/AgentModuleCard";

export const metadata: Metadata = {
title: "AI Agent Marketplace",
description: "Discover and explore specialized AI agents for your business needs",
};

export default function AIMarketplacePage() {
const agentModules = [
{
id: "capacity-planning",
title: "Capacity Planning",
description: "Optimize resource allocation and plan for future capacity needs",
icon: "📊",
features: [
"Resource utilization analysis",
"Demand forecasting",
"Scenario modeling",
"Capacity optimization recommendations"
]
},
{
id: "forecasting",
title: "Forecasting",
description: "Generate accurate forecasts for business metrics and trends",
icon: "📈",
features: [
"Time series forecasting",
"Multiple model support",
"Confidence intervals",
"Forecast accuracy evaluation"
]
},
{
id: "occupancy-modeling",
title: "Occupancy Modeling",
description: "Model and predict occupancy patterns for optimal space utilization",
icon: "🏢",
features: [
"Occupancy pattern analysis",
"Space utilization optimization",
"Peak time prediction",
"Resource allocation planning"
]
},
{
id: "onboarding",
title: "Onboarding",
description: "Streamline the onboarding process with intelligent automation",
icon: "👥",
features: [
"Personalized onboarding paths",
"Progress tracking",
"Resource recommendations",
"Onboarding effectiveness analysis"
]
}
];

return (
<div className="container mx-auto px-4 py-8">
<WelcomeHero />
<section className="mt-12">
<h2 className="text-3xl font-bold text-center mb-8">
Available Agent Modules
</h2>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
{agentModules.map((module) => (
<AgentModuleCard key={module.id} module={module} />
))}
</div>
</section>
</div>
);
}
