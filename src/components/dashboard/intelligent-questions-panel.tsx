'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, TrendingUp, BarChart3, HelpCircle,
  Zap, CheckCircle, Activity, Target
} from 'lucide-react';
import { 
  INTELLIGENT_QUESTIONS, 
  getSuggestedQuestions, 
  getQuestionsByCategory,
  type IntelligentQuestion 
} from '@/lib/intelligent-questions';
import { useApp } from './app-provider';

interface IntelligentQuestionsPanelProps {
  onQuestionClick: (question: string) => void;
}

export default function IntelligentQuestionsPanel({ onQuestionClick }: IntelligentQuestionsPanelProps) {
  const { state } = useApp();

  const context = useMemo(() => ({
    hasData: state.selectedLob?.hasData || false,
    hasForecast: state.analyzedData.hasForecasting || false,
    hasEDA: state.analyzedData.hasEDA || false,
    lastAnalysisType: state.analyzedData.lastAnalysisType
  }), [state.selectedLob, state.analyzedData]);

  const suggestedQuestions = useMemo(() => 
    getSuggestedQuestions(context), 
    [context]
  );

  const getCategoryIcon = (category: IntelligentQuestion['category']) => {
    switch (category) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'reliability': return <CheckCircle className="h-4 w-4" />;
      case 'data_quality': return <Activity className="h-4 w-4" />;
      case 'forecast': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <BarChart3 className="h-4 w-4" />;
      case 'comparison': return <Target className="h-4 w-4" />;
      case 'what_if': return <Zap className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: IntelligentQuestion['category']) => {
    switch (category) {
      case 'anomaly': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'reliability': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'data_quality': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case 'forecast': return 'text-purple-600 bg-purple-50 dark:bg-purple-950/20';
      case 'trend': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20';
      case 'comparison': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      case 'what_if': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const QuestionCard = ({ question }: { question: IntelligentQuestion }) => {
    const isDisabled = (question.requiresData && !context.hasData) || 
                      (question.requiresForecast && !context.hasForecast);

    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${isDisabled ? 'opacity-50' : ''}`}
        onClick={() => !isDisabled && onQuestionClick(question.question)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getCategoryColor(question.category)}`}>
              {getCategoryIcon(question.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1 line-clamp-2">
                {question.question}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {question.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {question.category.replace('_', ' ')}
                </Badge>
                {isDisabled && (
                  <Badge variant="secondary" className="text-xs">
                    {question.requiresForecast ? 'Needs forecast' : 'Needs data'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!context.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Intelligent Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <HelpCircle className="mx-auto h-12 w-12 opacity-50 mb-3" />
            <p className="text-sm">Upload data to see intelligent questions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Ask Intelligent Questions
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Click any question to get instant insights
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="suggested" className="w-full">
          <div className="px-4 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggested" className="text-xs">Suggested</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="suggested" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {suggestedQuestions.length > 0 ? (
                  suggestedQuestions.map(q => (
                    <QuestionCard key={q.id} question={q} />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">No suggested questions available</p>
                    <p className="text-xs mt-1">Try running an analysis first</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="categories" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {(['anomaly', 'data_quality', 'reliability', 'forecast', 'trend', 'comparison', 'what_if'] as const).map(category => {
                  const questions = getQuestionsByCategory(category);
                  const availableQuestions = questions.filter(q => 
                    (!q.requiresData || context.hasData) && 
                    (!q.requiresForecast || context.hasForecast)
                  );

                  if (availableQuestions.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${getCategoryColor(category)}`}>
                          {getCategoryIcon(category)}
                        </div>
                        <h4 className="text-sm font-medium capitalize">
                          {category.replace('_', ' ')}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {availableQuestions.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-8">
                        {availableQuestions.map(q => (
                          <Button
                            key={q.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2 px-3"
                            onClick={() => onQuestionClick(q.question)}
                          >
                            <span className="text-xs line-clamp-2">{q.question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {INTELLIGENT_QUESTIONS
                  .filter(q => 
                    (!q.requiresData || context.hasData) && 
                    (!q.requiresForecast || context.hasForecast)
                  )
                  .map(q => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
