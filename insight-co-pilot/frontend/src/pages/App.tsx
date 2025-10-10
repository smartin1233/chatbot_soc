import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Database, TrendingUp, LineChart, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function App() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Onboarding Agents",
      description: "Fetch, manage, compare, and model your business data",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Forecasting Agents",
      description: "Explore, clean, train, and evaluate predictive models",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Cross-Workflow Agents",
      description: "Visualize insights and generate actionable recommendations",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-slate-100">
              Insight Co-Pilot
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              An AI-powered business analytics assistant that helps you analyze data,
              generate forecasts, and visualize insights through natural conversation.
            </p>
          </div>
          <div className="flex gap-4 justify-center mt-8">
            <Button
              onClick={() => navigate('/chat')}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-violet-500/20"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Chatting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-800/50 border-slate-700 p-6 space-y-4 hover:bg-slate-800/70 transition-all hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}>
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-100">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Key Capabilities */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-slate-100 text-center">Key Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
              <div>
                <h4 className="font-medium text-slate-200">Modular Agent Architecture</h4>
                <p className="text-sm text-slate-400">Specialized AI agents for different analytics tasks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
              <div>
                <h4 className="font-medium text-slate-200">Intelligent Workflow Orchestration</h4>
                <p className="text-sm text-slate-400">LangGraph-powered state management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
              <div>
                <h4 className="font-medium text-slate-200">Real-time Data Analysis</h4>
                <p className="text-sm text-slate-400">Instant insights from your business metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
              <div>
                <h4 className="font-medium text-slate-200">Persistent Conversation History</h4>
                <p className="text-sm text-slate-400">Context-aware interactions across sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
