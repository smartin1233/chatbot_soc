
import { statisticalAnalyzer } from '@/lib/statistical-analysis';
import type { WeeklyData } from '@/lib/types';

export interface CapacityPlanningInput {
  historicalData: WeeklyData[];
  forecastData: { week: number; value: number }[];
  assumptions: {
    callsPerHeadcount: number;
    shrinkage: number; // percentage
  };
}

export interface CapacityPlanningOutput {
  headcount: { week: number; required: number }[];
  assumptions: {
    callsPerHeadcount: number;
    shrinkage: number;
  };
  justification: string;
}

export class CapacityPlanningAgent {
  async run(input: CapacityPlanningInput): Promise<CapacityPlanningOutput> {
    const historicalValues = input.historicalData.map(d => d.Value);
    const forecastValues = input.forecastData.map(d => d.value);

    // Generate intelligent default assumptions
    const avgHistoricalValue = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const callsPerHeadcount = Math.round(avgHistoricalValue / 20); // Placeholder logic
    const shrinkage = 0.15; // Placeholder logic

    const assumptions = {
      callsPerHeadcount: input.assumptions?.callsPerHeadcount || callsPerHeadcount,
      shrinkage: input.assumptions?.shrinkage || shrinkage,
    };

    const headcount = input.forecastData.map(dataPoint => {
      const required =
        dataPoint.value /
        (assumptions.callsPerHeadcount * (1 - assumptions.shrinkage));
      return {
        week: dataPoint.week,
        required: Math.ceil(required),
      };
    });

    const justification = `Based on the historical average of ${avgHistoricalValue.toFixed(
      2
    )} and a target of 20 calls per headcount, we recommend ${callsPerHeadcount} calls per headcount. Shrinkage is estimated at 15%.`;

    return {
      headcount,
      assumptions,
      justification,
    };
  }
}
