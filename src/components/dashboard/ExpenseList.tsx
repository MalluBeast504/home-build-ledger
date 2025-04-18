
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  vendor: { name: string; type: string } | null;
};

// Define the valid expense categories type using the Constants enum
type ExpenseCategory = typeof Constants.public.Enums.expense_category[number];

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  // Update state type to be either a valid expense category or an empty string
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("");

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, vendorTypeFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("expenses")
        .select(`
          *,
          vendor:vendors(name, type)
        `)
        .order('date', { ascending: false });

      if (categoryFilter) {
        // Now categoryFilter is properly typed to match the expected enum values
        query = query.eq('category', categoryFilter);
      }
      if (vendorTypeFilter) {
        query = query.eq('vendors.type', vendorTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExpenses(data as Expense[]);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses List</CardTitle>
        <div className="flex gap-4">
          <Select 
            value={categoryFilter} 
            onValueChange={(value: ExpenseCategory | "") => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {Constants.public.Enums.expense_category.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by person type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No expenses found</TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell>{expense.description || '-'}</TableCell>
                    <TableCell>{expense.vendor ? `${expense.vendor.name} (${expense.vendor.type})` : '-'}</TableCell>
                    <TableCell>{formatAmount(expense.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
