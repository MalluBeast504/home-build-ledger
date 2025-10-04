import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Search,
  X,
  Pencil,
  CalendarIcon,
  PlusCircle,
  ChevronsUpDown,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CommandPalette } from "@/components/command-palette";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { useToast } from "@/components/ui/use-toast";
import { clsx } from "clsx";
import { ExpensesTable } from "@/components/ExpensesTable";
import { Expense } from "@/types/expense";
import { Label } from "@/components/ui/label";
import { ExpenseFilters } from "@/components/ExpenseFilters";

interface CategoryTotal {
  category: string;
  total: number;
}

interface MonthlyTotal {
  month: string;
  total: number;
}

interface Vendor {
  id: string;
  name: string;
  type: string;
}

interface EditExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  vendor_id: string | null;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface CustomCategory {
  id: number;
  name: string;
}

interface SearchSuggestion {
  type: "category" | "vendor" | "amount" | "date" | "description";
  value: string;
  label: string;
  searchValue: string;
}

const VENDOR_TYPES = ["engineer", "contractor", "supplier", "labour"] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTotal[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EditExpense | null>(
    null
  );
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");
  const [newVendorId, setNewVendorId] = useState<string>("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newCustomCategories, setNewCustomCategories] = useState<
    CustomCategory[]
  >([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorType, setNewVendorType] =
    useState<(typeof VENDOR_TYPES)[number]>("contractor");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { toast } = useToast();

  // Add to the state declarations at the top
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });

    fetchExpenses();
    fetchVendors();
    fetchCustomCategories();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [
    expenses,
    categoryFilter,
    vendorFilter,
    vendorTypeFilter,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    searchTerm,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchDialogOpen((open) => !open);
      }
      // Command/Ctrl + N for new expense
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsAddingExpense(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name");

      if (error) throw error;
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchCustomCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setNewCustomCategories(data);
    } catch (error: any) {
      console.error("Error fetching custom categories:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.category === categoryFilter
      );
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.vendor?.id === vendorFilter
      );
    }

    // Vendor type filter
    if (vendorTypeFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.vendor?.type === vendorTypeFilter
      );
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(
        (expense) => expense.amount >= parseFloat(minAmount)
      );
    }
    if (maxAmount) {
      filtered = filtered.filter(
        (expense) => expense.amount <= parseFloat(maxAmount)
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((expense) => expense.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((expense) => expense.date <= endDate);
    }

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description?.toLowerCase().includes(term) ||
          expense.category.toLowerCase().includes(term) ||
          expense.vendor?.name.toLowerCase().includes(term)
      );
    }

    setFilteredExpenses(filtered);
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    setVendorFilter("all");
    setVendorTypeFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const fetchExpenses = async () => {
    try {
      const { data: expensesData, error } = await supabase
        .from("expenses")
        .select("*, vendor:vendors(id, name, type)")
        .order("date", { ascending: false });

      if (error) throw error;

      const expenses = expensesData as Expense[];
      setExpenses(expenses);
      setFilteredExpenses(expenses);

      // Calculate total spent
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalSpent(total);

      // Calculate monthly totals and change
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });

      const lastMonthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === lastMonth &&
          expenseDate.getFullYear() === lastMonthYear
        );
      });

      const currentMonthTotal = currentMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const lastMonthTotal = lastMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      setMonthlySpent(currentMonthTotal);
      setMonthlyChange(
        lastMonthTotal === 0
          ? 0
          : ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      );

      // Calculate category totals and prepare pie chart data
      const categoryMap = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categoryMap).sort(
        ([, a], [, b]) => b - a
      );

      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

      let pieData: PieChartData[] = [];

      // Add top 3 categories
      sortedCategories.slice(0, 3).forEach(([category, value], index) => {
        pieData.push({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value,
          color: colors[index],
        });
      });

      // Sum up the rest as "Other"
      const otherValue = sortedCategories
        .slice(3)
        .reduce((sum, [, value]) => sum + value, 0);
      if (otherValue > 0) {
        pieData.push({
          name: "Other",
          value: otherValue,
          color: colors[3],
        });
      }

      setPieChartData(pieData);
      setCategoryTotals(
        Object.entries(categoryMap).map(([category, total]) => ({
          category,
          total,
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;

      // Refresh the expenses list
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: expense.date,
      vendor_id: expense.vendor?.id || null,
    });
    setIsEditingExpense(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("expenses")
        .update({
          amount: editingExpense.amount,
          category: editingExpense.category,
          description: editingExpense.description,
          date: editingExpense.date,
          vendor_id: editingExpense.vendor_id,
        })
        .eq("id", editingExpense.id);

      if (error) throw error;

      setIsEditingExpense(false);
      setEditingExpense(null);
      fetchExpenses();
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to add categories");

      const { error } = await supabase.from("custom_categories").insert({
        name: newCategoryName.trim(),
        user_id: user.id,
      });

      if (error) throw error;

      setNewCategoryName("");
      setIsAddingCategory(false);
      fetchCustomCategories();
    } catch (error: any) {
      console.error("Error adding category:", error);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to add vendors");

      const { data, error } = await supabase
        .from("vendors")
        .insert({
          name: newVendorName.trim(),
          type: newVendorType,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setNewVendorName("");
      setIsAddingVendor(false);
      fetchVendors();

      // Auto-select the newly created vendor
      if (data) {
        setNewVendorId(data.id);
      }
    } catch (error: any) {
      console.error("Error adding vendor:", error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be logged in to add expenses");

      const { error } = await supabase.from("expenses").insert({
        amount: parseFloat(newAmount),
        category: newCategory,
        description: newDescription,
        vendor_id: newVendorId || null,
        date: newDate,
        user_id: user.id,
      });

      if (error) throw error;

      setNewAmount("");
      setNewCategory("");
      setNewDescription("");
      setNewVendorId("");
      setNewDate(format(new Date(), "yyyy-MM-dd"));
      setIsAddingExpense(false);
      fetchExpenses();
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSearchSuggestions = (searchValue: string) => {
    const suggestions: SearchSuggestion[] = [];
    const lowercaseSearch = searchValue.toLowerCase();

    // Category suggestions
    const allCategories = [
      ...Constants.public.Enums.expense_category,
      ...newCustomCategories.map((c) => c.name),
    ];
    allCategories.forEach((category) => {
      if (category.toLowerCase().includes(lowercaseSearch)) {
        suggestions.push({
          type: "category",
          value: category,
          label: `Category: ${category}`,
          searchValue: category,
        });
      }
    });

    // Vendor suggestions
    vendors.forEach((vendor) => {
      if (
        vendor.name.toLowerCase().includes(lowercaseSearch) ||
        vendor.type.toLowerCase().includes(lowercaseSearch)
      ) {
        suggestions.push({
          type: "vendor",
          value: vendor.id,
          label: `Person: ${vendor.name} (${vendor.type})`,
          searchValue: `${vendor.name} ${vendor.type}`,
        });
      }
    });

    // Amount suggestions
    if (!isNaN(parseFloat(searchValue))) {
      suggestions.push({
        type: "amount",
        value: searchValue,
        label: `Amount: ${formatCurrency(parseFloat(searchValue))}`,
        searchValue: searchValue,
      });
    }

    // Description suggestions from existing expenses
    const uniqueDescriptions = new Set(
      expenses.map((e) => e.description).filter(Boolean)
    );
    uniqueDescriptions.forEach((description) => {
      if (description?.toLowerCase().includes(lowercaseSearch)) {
        suggestions.push({
          type: "description",
          value: description,
          label: `Description: ${description}`,
          searchValue: description,
        });
      }
    });

    return suggestions;
  };

  const handleSearchSelect = (suggestion: SearchSuggestion) => {
    setSearchDialogOpen(false);

    // Apply the selected filter
    switch (suggestion.type) {
      case "category":
        setCategoryFilter(suggestion.value);
        break;
      case "vendor":
        setVendorFilter(suggestion.value);
        break;
      case "amount":
        const amount = parseFloat(suggestion.value);
        setMinAmount(amount.toString());
        setMaxAmount(amount.toString());
        break;
      case "description":
        setSearchTerm(suggestion.value);
        break;
    }
  };

  // Export functionality
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportToPDF(
        expenses,
        `expenses-${format(new Date(), "yyyy-MM-dd")}.pdf`
      );
      toast({
        title: "Export Successful",
        description: "Your expenses have been exported to PDF.",
      });
    } catch (error) {
      console.error("Error during PDF export:", error); // Add this line
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting your expenses. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  total: {
                    label: "Total",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={monthlyTrend}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  expenses: {
                    label: "Expenses",
                  },
                  ...pieChartData.reduce(
                    (acc, cur) => ({
                      ...acc,
                      [cur.name]: { label: cur.name, color: cur.color },
                    }),
                    {}
                  ),
                }}
                className="mx-auto aspect-square h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {pieChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Expense List */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <div className="w-full">
              <ExpenseFilters
                categoryFilter={categoryFilter}
                vendorFilter={vendorFilter}
                vendorTypeFilter={vendorTypeFilter}
                minAmount={minAmount}
                maxAmount={maxAmount}
                startDate={startDate}
                endDate={endDate}
                searchTerm={searchTerm}
                onCategoryChange={setCategoryFilter}
                onVendorChange={setVendorFilter}
                onVendorTypeChange={setVendorTypeFilter}
                onMinAmountChange={setMinAmount}
                onMaxAmountChange={setMaxAmount}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onSearchTermChange={setSearchTerm}
                onResetFilters={resetFilters}
                vendors={vendors}
                customCategories={newCustomCategories.map(cat => cat.name)}
                onSearchDialogOpen={() => setSearchDialogOpen(true)}
              />
            </div>

            <CommandDialog
              open={searchDialogOpen}
              onOpenChange={setSearchDialogOpen}
            >
              <CommandInput
                placeholder="Search expenses..."
                onValueChange={(search) => {
                  setSearchSuggestions(generateSearchSuggestions(search));
                }}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {searchSuggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {searchSuggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.type}-${index}`}
                        value={suggestion.searchValue}
                        onSelect={() => handleSearchSelect(suggestion)}
                      >
                        {suggestion.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandSeparator />
                <CommandGroup heading="Tips">
                  <CommandItem>
                    Search by category, person, amount, or description
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>

            <div className="flex justify-end gap-4 mt-4">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export to PDF"}
              </Button>
              <Button onClick={() => setIsAddingExpense(true)}>
                New Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <ExpensesTable
                expenses={filteredExpenses}
                onEdit={handleEditExpense}
                onDelete={deleteExpense}
                loading={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Expense Dialog */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Predefined Categories</SelectLabel>
                        {Constants.public.Enums.expense_category.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {newCustomCategories.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Custom Categories</SelectLabel>
                          {newCustomCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name.charAt(0).toUpperCase() +
                                cat.name.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor" className="text-right">
                  Person
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select value={newVendorId} onValueChange={setNewVendorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Person</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingVendor(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !newDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? (
                        format(new Date(newDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newDate ? new Date(newDate) : undefined}
                      onSelect={(date) =>
                        date && setNewDate(format(date, "yyyy-MM-dd"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingExpense(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCategory(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Vendor Dialog */}
        <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Person name"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
              />
              <Select
                value={newVendorType}
                onValueChange={(value: (typeof VENDOR_TYPES)[number]) =>
                  setNewVendorType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingVendor(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddVendor}>Add Person</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          setOpen={setCommandPaletteOpen}
          onAddExpense={() => setIsAddingExpense(true)}
        />
      </div>

      <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateExpense} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-amount"
                type="number"
                value={editingExpense?.amount || ""}
                onChange={(e) =>
                  setEditingExpense((prev) =>
                    prev
                      ? {
                          ...prev,
                          amount: parseFloat(e.target.value),
                        }
                      : null
                  )
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={editingExpense?.category || ""}
                onValueChange={(value) =>
                  setEditingExpense((prev) =>
                    prev
                      ? {
                          ...prev,
                          category: value,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Predefined Categories</SelectLabel>
                    {Constants.public.Enums.expense_category.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  {newCustomCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Custom Categories</SelectLabel>
                      {newCustomCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-vendor" className="text-right">
                Person
              </Label>
              <Select
                value={editingExpense?.vendor_id || "none"}
                onValueChange={(value) =>
                  setEditingExpense((prev) =>
                    prev
                      ? {
                          ...prev,
                          vendor_id: value === "none" ? null : value,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Person</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !editingExpense?.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingExpense?.date ? (
                      format(new Date(editingExpense.date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      editingExpense?.date
                        ? new Date(editingExpense.date)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setEditingExpense((prev) =>
                          prev
                            ? {
                                ...prev,
                                date: format(date, "yyyy-MM-dd"),
                              }
                            : null
                        );
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                placeholder="Description"
                value={editingExpense?.description || ""}
                onChange={(e) =>
                  setEditingExpense((prev) =>
                    prev
                      ? {
                          ...prev,
                          description: e.target.value,
                        }
                      : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingExpense(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
