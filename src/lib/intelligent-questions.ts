/**
 * Intelligent Sample Questions - Context-aware questions users can ask
 */

export interface IntelligentQuestion {
    id: string;
    question: string;
    category: 'anomaly' | 'reliability' | 'data_quality' | 'forecast' | 'trend' | 'comparison' | 'what_if';
    description: string;
    requiresData: boolean;
    requiresForecast: boolean;
}

export const INTELLIGENT_QUESTIONS: IntelligentQuestion[] = [
    // Simple Anomaly Questions
    {
        id: 'outlier-check',
        question: 'Why did my numbers drop by 20% recently?',
        category: 'anomaly',
        description: 'Find out if this drop is normal or something to worry about',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'unusual-spike',
        question: 'Why did I have a big spike last month?',
        category: 'anomaly',
        description: 'Understand sudden increases in your data',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'anomaly-detection',
        question: 'Is anything unusual happening in my data?',
        category: 'anomaly',
        description: 'Check for weird patterns or unexpected changes',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'weekend-anomaly',
        question: 'Why are weekends different from weekdays?',
        category: 'anomaly',
        description: 'See if weekends have different patterns',
        requiresData: true,
        requiresForecast: false
    },

    // Simple Data Quality Questions
    {
        id: 'data-reliability',
        question: 'Can I trust this forecast?',
        category: 'reliability',
        description: 'Find out how accurate the predictions are',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'confidence-level',
        question: 'How sure are you about these predictions?',
        category: 'reliability',
        description: 'See how confident the forecast is',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'data-quality-score',
        question: 'Is my data good quality?',
        category: 'data_quality',
        description: 'Check if your data is complete and accurate',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'missing-data',
        question: 'Am I missing any data?',
        category: 'data_quality',
        description: 'Find gaps or missing information in your data',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'data-consistency',
        question: 'Is my data reliable over time?',
        category: 'data_quality',
        description: 'Check if your data is consistent',
        requiresData: true,
        requiresForecast: false
    },

    // Simple Forecast Questions
    {
        id: 'forecast-accuracy',
        question: 'Were my past predictions accurate?',
        category: 'forecast',
        description: 'See how well previous forecasts matched reality',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'forecast-range',
        question: 'What will my numbers be next month?',
        category: 'forecast',
        description: 'Get predictions for the coming month',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'forecast-peak',
        question: 'When will I hit my highest numbers?',
        category: 'forecast',
        description: 'Find out when you will reach peak values',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'seasonal-forecast',
        question: 'Do seasons affect my forecast?',
        category: 'forecast',
        description: 'See if time of year impacts predictions',
        requiresData: true,
        requiresForecast: true
    },

    // Simple Trend Questions
    {
        id: 'trend-direction',
        question: 'Am I going up or down?',
        category: 'trend',
        description: 'See if your numbers are increasing or decreasing',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'growth-rate',
        question: 'How fast am I growing?',
        category: 'trend',
        description: 'Find out your growth rate',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'trend-change',
        question: 'When did things start changing?',
        category: 'trend',
        description: 'Find when your trend shifted direction',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'seasonal-pattern',
        question: 'Do I have repeating patterns?',
        category: 'trend',
        description: 'Check for seasonal or recurring patterns',
        requiresData: true,
        requiresForecast: false
    },

    // Simple Comparison Questions
    {
        id: 'compare-periods',
        question: 'How am I doing compared to last quarter?',
        category: 'comparison',
        description: 'Compare this quarter to the previous one',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'year-over-year',
        question: 'Am I better than last year?',
        category: 'comparison',
        description: 'Compare this year to last year',
        requiresData: true,
        requiresForecast: false
    },
    {
        id: 'best-worst-periods',
        question: 'When was I doing best and worst?',
        category: 'comparison',
        description: 'Find your best and worst time periods',
        requiresData: true,
        requiresForecast: false
    },

    // Simple What-If Questions
    {
        id: 'what-if-reduction',
        question: 'What if my numbers drop by 20%?',
        category: 'what_if',
        description: 'See what happens if things decrease',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'what-if-growth',
        question: 'What if I grow 15% faster?',
        category: 'what_if',
        description: 'See what happens with faster growth',
        requiresData: true,
        requiresForecast: true
    },
    {
        id: 'what-if-seasonal',
        question: 'What if my patterns change?',
        category: 'what_if',
        description: 'See impact of changing patterns',
        requiresData: true,
        requiresForecast: true
    }
];

/**
 * Get relevant questions based on current context
 */
export function getRelevantQuestions(context: {
    hasData: boolean;
    hasForecast: boolean;
    hasEDA: boolean;
    recentActivity?: string[];
}): IntelligentQuestion[] {
    return INTELLIGENT_QUESTIONS.filter(q => {
        // Filter based on data availability
        if (q.requiresData && !context.hasData) return false;
        if (q.requiresForecast && !context.hasForecast) return false;

        return true;
    });
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: IntelligentQuestion['category']): IntelligentQuestion[] {
    return INTELLIGENT_QUESTIONS.filter(q => q.category === category);
}

/**
 * Get suggested questions based on user's recent activity
 */
export function getSuggestedQuestions(context: {
    hasData: boolean;
    hasForecast: boolean;
    hasEDA: boolean;
    lastAnalysisType?: string;
}): IntelligentQuestion[] {
    const relevant = getRelevantQuestions(context);

    // Prioritize based on last analysis type
    if (context.lastAnalysisType === 'forecasting') {
        return [
            ...relevant.filter(q => q.category === 'forecast' || q.category === 'reliability'),
            ...relevant.filter(q => q.category === 'what_if'),
            ...relevant.filter(q => q.category !== 'forecast' && q.category !== 'reliability' && q.category !== 'what_if')
        ].slice(0, 6);
    }

    if (context.lastAnalysisType === 'eda') {
        return [
            ...relevant.filter(q => q.category === 'data_quality' || q.category === 'anomaly'),
            ...relevant.filter(q => q.category === 'trend'),
            ...relevant.filter(q => q.category !== 'data_quality' && q.category !== 'anomaly' && q.category !== 'trend')
        ].slice(0, 6);
    }

    // Default: show a mix
    return [
        ...relevant.filter(q => q.category === 'data_quality').slice(0, 2),
        ...relevant.filter(q => q.category === 'trend').slice(0, 2),
        ...relevant.filter(q => q.category === 'forecast').slice(0, 2)
    ];
}

/**
 * Search questions by keyword
 */
export function searchQuestions(keyword: string): IntelligentQuestion[] {
    const lowerKeyword = keyword.toLowerCase();
    return INTELLIGENT_QUESTIONS.filter(q =>
        q.question.toLowerCase().includes(lowerKeyword) ||
        q.description.toLowerCase().includes(lowerKeyword) ||
        q.category.toLowerCase().includes(lowerKeyword)
    );
}
