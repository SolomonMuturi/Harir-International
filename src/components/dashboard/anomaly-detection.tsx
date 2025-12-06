
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAnomalyExplanation } from '@/app/actions';
import type { ExplainAnomalyInput, ExplainAnomalyOutput } from '@/ai/flows/explain-anomaly-detection';
import { Loader2, Sparkles, Lightbulb, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AnomalyDetectionProps {
  anomalies: ExplainAnomalyInput[];
  onExplain?: (input: ExplainAnomalyInput) => Promise<ExplainAnomalyOutput>;
}

export function AnomalyDetection({ anomalies, onExplain }: AnomalyDetectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainAnomalyOutput | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<ExplainAnomalyInput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleExplain = async (anomaly: ExplainAnomalyInput) => {
    setIsLoading(true);
    setSelectedAnomaly(anomaly);
    setExplanation(null);
    setIsDialogOpen(true);
    
    const inputForAI: ExplainAnomalyInput = {
      ...anomaly,
      timestamp: new Date(anomaly.timestamp).toISOString(),
    };
    
    const explainFunction = onExplain || getAnomalyExplanation;
    const result = await explainFunction(inputForAI);

    setExplanation(result);
    setIsLoading(false);

    // Simulate sending notifications after explanation is received
    toast({
      title: 'Alerts Sent!',
      description: `Notifications for "${anomaly.metricName}" anomaly sent via In-App, SMS, and Email to designated staff.`,
    });
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Anomaly Detection
          </CardTitle>
          <CardDescription>
            AI-powered monitoring for deviations from standards.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-[250px]">
            <div className="space-y-4 p-6 pt-0">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{anomaly.metricName}</p>
                    <p className="text-xs text-muted-foreground">
                      Value: {anomaly.metricValue} (Expected: {anomaly.expectedValue})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplain(anomaly)}
                  >
                    Explain
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Anomaly Explanation
            </DialogTitle>
            <DialogDescription>
              {selectedAnomaly?.metricName} at {new Date(selectedAnomaly?.timestamp || 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-foreground space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <p>{explanation?.explanation}</p>
                {explanation?.suggestedAction && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Suggested Action
                    </h4>
                    <p className="text-muted-foreground">{explanation.suggestedAction}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
