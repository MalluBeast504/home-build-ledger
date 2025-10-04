import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText } from "lucide-react";
import { Expense } from "@/types/expense";
import { exportToPDF } from "@/lib/export";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
  onClose: () => void;
}

export function PdfPreviewModal({
  open,
  onOpenChange,
  expenses,
  onClose,
}: PdfPreviewModalProps) {
  const [selectedExpenses, setSelectedExpenses] = useState<
    Record<string, boolean>
  >(expenses.reduce((acc, expense) => ({ ...acc, [expense.id]: true }), {}));
  const [isExporting, setIsExporting] = useState(false);

  const selectedExpenseList = useMemo(() => {
    return expenses.filter((expense) => selectedExpenses[expense.id]);
  }, [expenses, selectedExpenses]);

  const handleToggleExpense = (id: string) => {
    setSelectedExpenses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    setSelectedExpenses(
      expenses.reduce((acc, expense) => ({ ...acc, [expense.id]: true }), {})
    );
  };

  const handleDeselectAll = () => {
    setSelectedExpenses(
      expenses.reduce((acc, expense) => ({ ...acc, [expense.id]: false }), {})
    );
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportToPDF(
        selectedExpenseList,
        `expenses-${new Date().toISOString().split("T")[0]}.pdf`
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error during PDF export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Function to format currency as it appears in the PDF export
  const formatCurrencyForPDF = (amount: number) => {
    return (
      "₹" +
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle>PDF Export Preview</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Selected: {selectedExpenseList.length} of {expenses.length} entries
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Include</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Person</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow
                  key={expense.id}
                  className={
                    index % 2 === 0
                      ? "bg-gray-50 dark:bg-[#3333]"
                      : "bg-white dark:bg-[#212121]"
                  }
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedExpenses[expense.id]}
                      onCheckedChange={() => handleToggleExpense(expense.id)}
                    />
                  </TableCell>
                  <TableCell className="dark:text-gray-200">
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell className="dark:text-gray-200">
                    <span className="capitalize">{expense.category}</span>
                  </TableCell>
                  <TableCell className="dark:text-gray-200">
                    {expense.description || "-"}
                  </TableCell>
                  <TableCell className="dark:text-gray-20">
                    {expense.vendor
                      ? `${expense.vendor.name} (${expense.vendor.type})`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right dark:text-gray-200">
                    {formatCurrencyForPDF(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedExpenseList.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF ({selectedExpenseList.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
