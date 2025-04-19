import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";

interface ExpenseStatsProps {
  expenses: any[];
  formatCurrency: (amount: number) => string;
}

export function ExpenseStats({ expenses, formatCurrency }: ExpenseStatsProps) {
  const stats = {
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    average: expenses.length ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0,
    highest: expenses.length ? Math.max(...expenses.map(e => e.amount)) : 0,
    lowest: expenses.length ? Math.min(...expenses.map(e => e.amount)) : 0,
    count: expenses.length
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Info className="h-4 w-4 cursor-help" />
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Expense Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Average</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats.average)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Highest</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats.highest)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Lowest</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats.lowest)}</p>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 