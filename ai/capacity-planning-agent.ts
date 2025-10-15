
export type CapacityPlanningInput = {
  historicalData: { date: string; value: number }[];
  forecastData: { date: string; value: number }[];
  assumptions: {
    callsPerHeadcount: number;
    shrinkage: number; // percentage
  };
};

export type CapacityPlanningOutput = {
  headcount: { date: string; required: number }[];
  explanation: string;
};

export class CapacityPlanningAgent {
  async run(input: CapacityPlanningInput): Promise<CapacityPlanningOutput> {
    const headcount = input.forecastData.map(dataPoint => {
      const required =
        dataPoint.value /
        (input.assumptions.callsPerHeadcount * (1 - input.assumptions.shrinkage));
      return {
        date: dataPoint.date,
        required: Math.ceil(required),
      };
    });

    const explanation = `Based on the forecast and the provided assumptions (calls per headcount: ${
      input.assumptions.callsPerHeadcount
    }, shrinkage: ${
      input.assumptions.shrinkage * 100
    }%), the required headcount has been calculated.`;

    return {
      headcount,
      explanation,
    };
  }
}
