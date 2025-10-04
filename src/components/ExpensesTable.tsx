import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/advanced-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Expense } from "@/types/expense";
import { clsx } from "clsx";

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const columnHelper = createColumnHelper<Expense>();

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export function ExpensesTable({ expenses, onEdit, onDelete, loading = false }: ExpensesTableProps) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const columns = [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      sortingFn: 'datetime',
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('vendor', {
      header: 'Person',
      cell: (info) => {
        const vendor = info.getValue();
        return vendor ? `${vendor.name} (${vendor.type})` : '-';
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => {
        const amount = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <span className={clsx(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap",
              {
                "bg-green-100 text-green-700": amount < 100,
                "bg-yellow-100 text-yellow-700": amount >= 1000 && amount < 5000,
                "bg-red-100 text-red-700": amount >= 5000,
              }
            )}>
              {amount < 1000 ? "Low" : amount < 5000 ? "Medium" : "High"}
            </span>
            <span className="whitespace-nowrap">{formatCurrency(amount)}</span>
          </div>
        );
      },
      sortingFn: 'alphanumeric',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const expense = info.row.original;
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(expense)}
              disabled={loading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this expense? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(expense.id)} 
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    }),
  ];

  return (
    <div className="min-w-[800px] px-4 md:px-0">
      <DataTable
        columns={columns}
        data={expenses}
        searchField="description"
        searchPlaceholder="Search expenses..."
      />
    </div>
  );
};