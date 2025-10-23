import type { TeamPeriodicMetrics } from "@/components/capacity-insights/types";

export function calculateTeamMetricsForPeriod(
  teamInputDataCurrentPeriod: Partial<TeamPeriodicMetrics>,
  lobTotalBaseRequiredMinutesForPeriod: number | null,
  standardWorkMinutesForPeriod: number,
  volumeData: number,
  reqHc: number,
  actualHc: number,
  lastHc: number,
  isBPO: boolean
): TeamPeriodicMetrics {
  const defaults: TeamPeriodicMetrics = {
    aht: null,
    inOfficeShrinkagePercentage: null,
    outOfOfficeShrinkagePercentage: null,
    occupancyPercentage: null,
    backlogPercentage: null,
    attritionPercentage: null,
    volumeMixPercentage: null,
    actualHC: null,
    moveIn: null,
    moveOut: null,
    newHireBatch: null,
    newHireProduction: null,
    lobVolumeForecast: null,
    handlingCapacity: null,
    _productivity: null,
    _calculatedRequiredAgentMinutes: null,
    _calculatedActualProductiveAgentMinutes: null,
    requiredHC: null,
    overUnderHC: null,
    attritionLossHC: null,
    hcAfterAttrition: null,
    endingHC: null,
    _lobTotalBaseReqMinutesForCalc: null,
    ...teamInputDataCurrentPeriod,
  };
  

  const baseTeamRequiredMinutes = (lobTotalBaseRequiredMinutesForPeriod ?? 0) * ((defaults.volumeMixPercentage ?? 0) / 100);
  const effectiveTeamRequiredMinutes = baseTeamRequiredMinutes * (1 + ((defaults.backlogPercentage ?? 0) / 100));
  defaults._calculatedRequiredAgentMinutes = effectiveTeamRequiredMinutes;

  let requiredHC = null;
  let actualHCValue = null;
  

  const effectiveMinutesPerHC = (
    (volumeData * (defaults.volumeMixPercentage / 100) * defaults.aht) /
    (
      60 *
      (defaults.occupancyPercentage / 100) *
      (1 - (defaults.inOfficeShrinkagePercentage / 100)) *
      (1 - (defaults.outOfOfficeShrinkagePercentage / 100))
    ) *
    (1 + (defaults.backlogPercentage / 100)) / 40
  );

  if (actualHc > 0) {
    actualHCValue = actualHc;
  } else if(lastHc && !isBPO) {
    actualHCValue = (
      (lastHc * (1 - defaults.attritionPercentage / 100)) +
      (
        defaults.newHireProduction +
        defaults.moveIn +
        defaults.moveOut
      )
    );
  } else if(lastHc && isBPO) {
    actualHCValue = lastHc + defaults.moveIn + defaults.moveOut + defaults.newHireProduction
  }




  if (!isNaN(effectiveMinutesPerHC) && Math.abs(effectiveMinutesPerHC) > 0) {
    requiredHC = Math.abs(effectiveMinutesPerHC);
  } else {
    requiredHC = 0;
  }

   if (!isNaN(actualHCValue) && Math.abs(actualHCValue) > 0) {
    actualHCValue = Math.abs(actualHCValue);
  } else {
    actualHCValue = 0;
  }

  defaults.requiredHC = requiredHC;
  if(defaults.actualHC === 0){
    defaults.actualHC = actualHCValue;
  }
  const currentActualHC = defaults.actualHC ?? 0;
  defaults.overUnderHC = (currentActualHC !== null && requiredHC !== null) ? currentActualHC - requiredHC : null;

  if (currentActualHC !== null && standardWorkMinutesForPeriod > 0) {
    defaults._calculatedActualProductiveAgentMinutes = currentActualHC * standardWorkMinutesForPeriod *
      (1 - ((defaults.inOfficeShrinkagePercentage ?? 0) / 100)) *
      (1 - ((defaults.outOfOfficeShrinkagePercentage ?? 0) / 100)) *
      ((defaults.occupancyPercentage ?? 0) / 100);
  } else {
    defaults._calculatedActualProductiveAgentMinutes = 0;
  }

  const attritionLossHC = currentActualHC * ((defaults.attritionPercentage ?? 0) / 100);
  defaults.attritionLossHC = defaults.attritionLossHC || 0;
  defaults.newHireBatchTrain = defaults.newHireBatchTrain || 0;
  const hcAfterAttrition = currentActualHC - attritionLossHC;
  defaults.hcAfterAttrition = hcAfterAttrition;
  defaults.endingHC = hcAfterAttrition + (defaults.newHireProduction ?? 0) + (defaults.moveIn ?? 0) - (defaults.moveOut ?? 0);
  defaults._lobTotalBaseReqMinutesForCalc = lobTotalBaseRequiredMinutesForPeriod;

  return defaults;
}
