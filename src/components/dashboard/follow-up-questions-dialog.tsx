'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisRequirements, FollowUpQuestion, UserResponse } from '@/lib/follow-up-questions';

interface FollowUpQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: AnalysisRequirements | null;
  onSubmit: (responses: UserResponse[]) => void;
  onSkip: () => void;
}

export default function FollowUpQuestionsDialog({
  open,
  onOpenChange,
  requirements,
  onSubmit,
  onSkip
}: FollowUpQuestionsDialogProps) {
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [errors, setErrors] = useState<string[]>([]);

  if (!requirements) return null;

  const handleResponseChange = (questionId: string, value: any) => {
    const newResponses = new Map(responses);
    newResponses.set(questionId, value);
    setResponses(newResponses);
    
    // Clear errors when user provides input
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = () => {
    const userResponses: UserResponse[] = Array.from(responses.entries()).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    // Validate required questions
    const requiredQuestions = requirements.questions.filter(q => q.required);
    const missingRequired = requiredQuestions.filter(q => !responses.has(q.id));

    if (missingRequired.length > 0) {
      setErrors([`Please answer all required questions: ${missingRequired.map(q => q.question).join(', ')}`]);
      return;
    }

    onSubmit(userResponses);
    setResponses(new Map());
    setErrors([]);
  };

  const renderQuestion = (question: FollowUpQuestion) => {
    switch (question.type) {
      case 'single_choice':
        return (
          <RadioGroup
            value={responses.get(question.id) || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple_choice':
        const selectedOptions = responses.get(question.id) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentSelection = responses.get(question.id) || [];
                    let newSelection;
                    if (checked) {
                      newSelection = [...currentSelection, option];
                    } else {
                      newSelection = currentSelection.filter((item: string) => item !== option);
                    }
                    handleResponseChange(question.id, newSelection);
                  }}
                />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'text_input':
        return (
          <Textarea
            value={responses.get(question.id) || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="w-full"
          />
        );

      case 'number_input':
        return (
          <Input
            type="number"
            value={responses.get(question.id) || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter a number..."
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'forecasting':
        return '📈';
      case 'data_exploration':
        return '🔬';
      case 'modeling':
        return '🤖';
      case 'complete_analysis':
        return '🎯';
      case 'business_insights':
        return '💡';
      default:
        return '📊';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progress = (responses.size / requirements.questions.length) * 100;
  const requiredCount = requirements.questions.filter(q => q.required).length;
  const requiredCompleted = requirements.questions.filter(q => q.required && responses.has(q.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{getAnalysisTypeIcon(requirements.analysisType)}</span>
            <div>
              <div>Customize Your Analysis</div>
              <div className="text-sm text-muted-foreground font-normal">
                Help me understand your requirements for better results
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Overview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {requirements.analysisType.replace('_', ' ').charAt(0).toUpperCase() + requirements.analysisType.replace('_', ' ').slice(1)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Estimated completion time: {requirements.estimatedTime}
                  </p>
                </div>
                <Badge variant="outline" className={getPriorityColor(requirements.priority)}>
                  {requirements.priority.charAt(0).toUpperCase() + requirements.priority.slice(1)} Priority
                </Badge>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-muted-foreground">
                    {responses.size} of {requirements.questions.length} questions answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{requiredCompleted} of {requiredCount} required questions completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Please complete required fields</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          <div className="space-y-4">
            {requirements.questions.map((question, index) => (
              <Card key={question.id} className={cn(
                "transition-all duration-200",
                responses.has(question.id) ? "border-green-200 bg-green-50/30" : "",
                question.required && "border-l-4 border-l-blue-500"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium leading-tight">
                          {question.question}
                        </span>
                        {question.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">
                        {question.category.replace('_', ' ')} • {question.type.replace('_', ' ')}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderQuestion(question)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Helper Text */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-medium text-blue-800 mb-1">Why these questions?</h4>
                  <p className="text-blue-700">
                    These questions help me customize the analysis to your specific needs, ensuring more accurate results and relevant insights for your business context.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>This will help create a {requirements.estimatedTime} analysis</span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onSkip}
            >
              Skip & Use Defaults
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={requiredCompleted < requiredCount}
              className="min-w-[120px]"
            >
              {requiredCompleted < requiredCount 
                ? `${requiredCount - requiredCompleted} required left`
                : 'Start Analysis'
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}