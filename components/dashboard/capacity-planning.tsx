
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/components/dashboard/app-provider';

export default function CapacityPlanning() {
  const { state, dispatch } = useApp();
  const [assumptions, setAssumptions] = React.useState({
    callsPerHeadcount: 0,
    shrinkage: 0,
  });

  const handleRecalculate = () => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Recalculate capacity plan with calls per headcount: ${assumptions.callsPerHeadcount} and shrinkage: ${assumptions.shrinkage}`,
      },
    });
  };

  React.useEffect(() => {
    if (state.capacityPlan) {
      setAssumptions(state.capacityPlan.assumptions);
    }
  }, [state.capacityPlan]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Capacity Planning</CardTitle>
      </CardHeader>
      <CardContent>
        {state.capacityPlan ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="calls-per-headcount">Calls per Headcount</Label>
                <Input
                  id="calls-per-headcount"
                  type="number"
                  value={assumptions.callsPerHeadcount}
                  onChange={(e) =>
                    setAssumptions({ ...assumptions, callsPerHeadcount: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="shrinkage">Shrinkage (%)</Label>
                <Input
                  id="shrinkage"
                  type="number"
                  value={assumptions.shrinkage * 100}
                  onChange={(e) =>
                    setAssumptions({ ...assumptions, shrinkage: Number(e.target.value) / 100 })
                  }
                />
              </div>
            </div>
            <Button onClick={handleRecalculate} className="w-full mb-4">
              Recalculate
            </Button>
            <div>
              <h4 className="font-medium">Justification</h4>
              <p className="text-sm text-muted-foreground">{state.capacityPlan.justification}</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Required Headcount</h4>
              <ul className="text-sm">
                {state.capacityPlan.headcount.map((h) => (
                  <li key={h.week}>
                    Week {h.week}: {h.required} agents
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>Capacity planning component placeholder.</p>
        )}
      </CardContent>
    </Card>
  );
}
