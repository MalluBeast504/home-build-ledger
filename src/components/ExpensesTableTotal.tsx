import { Expense } from "@/types/expense";

interface ExpensesTableTotalProps {
  expenses: Expense[];
}

export function ExpensesTableTotal({ expenses }: ExpensesTableTotalProps) {
  // Calculate the total of the filtered expenses
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg border">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filtered Total</h3>
        <div className="text-2xl font-bold text-primary">
          {formatCurrency(total)}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Total of {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
      </p>
    </div>
  );
}