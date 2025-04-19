import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, IndianRupee, Calendar, Search, X, Pencil, CalendarIcon, PlusCircle, ChevronsUpDown, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
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
import { CommandPalette } from "@/components/command-palette";
import { exportToCSV } from "@/lib/export";
import { useToast } from "@/components/ui/use-toast";
import { SpeedDial } from "@/components/speed-dial";
import { clsx } from "clsx";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  vendor: { name: string; type: string; id: string } | null;
}

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
  type: 'category' | 'vendor' | 'amount' | 'date' | 'description';
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
  const [editingExpense, setEditingExpense] = useState<EditExpense | null>(null);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");
  const [newVendorId, setNewVendorId] = useState<string>("");
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newCustomCategories, setNewCustomCategories] = useState<CustomCategory[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorType, setNewVendorType] = useState<typeof VENDOR_TYPES[number]>("contractor");

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
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

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
  }, [expenses, categoryFilter, vendorFilter, vendorTypeFilter, minAmount, maxAmount, startDate, endDate, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchDialogOpen((open) => !open);
      }
      // Command/Ctrl + N for new expense
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddingExpense(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      console.error('Error fetching vendors:', error);
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
      console.error('Error fetching custom categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter(expense => expense.vendor?.id === vendorFilter);
    }

    // Vendor type filter
    if (vendorTypeFilter !== "all") {
      filtered = filtered.filter(expense => expense.vendor?.type === vendorTypeFilter);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(expense => expense.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(expense => expense.amount <= parseFloat(maxAmount));
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(expense => expense.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(expense => expense.date <= endDate);
    }

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
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
        .order('date', { ascending: false });

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

      const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      });

      const lastMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === lastMonth && 
               expenseDate.getFullYear() === lastMonthYear;
      });

      const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      setMonthlySpent(currentMonthTotal);
      setMonthlyChange(lastMonthTotal === 0 ? 0 : ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);

      // Calculate category totals and prepare pie chart data
      const categoryMap = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categoryMap)
        .sort(([, a], [, b]) => b - a);

      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
      
      let pieData: PieChartData[] = [];
      
      // Add top 3 categories
      sortedCategories.slice(0, 3).forEach(([category, value], index) => {
        pieData.push({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value,
          color: colors[index]
        });
      });
      
      // Sum up the rest as "Other"
      const otherValue = sortedCategories.slice(3).reduce((sum, [, value]) => sum + value, 0);
      if (otherValue > 0) {
        pieData.push({
          name: 'Other',
          value: otherValue,
          color: colors[3]
        });
      }

      setPieChartData(pieData);
      setCategoryTotals(
        Object.entries(categoryMap).map(([category, total]) => ({
          category,
          total
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the expenses list
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: expense.date,
      vendor_id: expense.vendor?.id || null
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
          vendor_id: editingExpense.vendor_id
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      setIsEditingExpense(false);
      setEditingExpense(null);
      fetchExpenses();
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (error) {
      console.error('Error updating expense:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to add categories");

      const { error } = await supabase
        .from("custom_categories")
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id,
        });

      if (error) throw error;

      setNewCategoryName("");
      setIsAddingCategory(false);
      fetchCustomCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      console.error('Error adding vendor:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be logged in to add expenses");
      
      const { error } = await supabase.from("expenses").insert({
        amount: parseFloat(newAmount),
        category: newCategory,
        description: newDescription,
        vendor_id: newVendorId || null,
        date: newDate,
        user_id: user.id
      });

      if (error) throw error;
      
      setNewAmount("");
      setNewCategory("");
      setNewDescription("");
      setNewVendorId("");
      setNewDate(format(new Date(), 'yyyy-MM-dd'));
      setIsAddingExpense(false);
      fetchExpenses();
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    } catch (error: any) {
      console.error('Error adding expense:', error);
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
    const allCategories = [...Constants.public.Enums.expense_category, ...newCustomCategories.map(c => c.name)];
    allCategories.forEach(category => {
      if (category.toLowerCase().includes(lowercaseSearch)) {
        suggestions.push({
          type: 'category',
          value: category,
          label: `Category: ${category}`,
          searchValue: category
        });
      }
    });

    // Vendor suggestions
    vendors.forEach(vendor => {
      if (vendor.name.toLowerCase().includes(lowercaseSearch) || 
          vendor.type.toLowerCase().includes(lowercaseSearch)) {
        suggestions.push({
          type: 'vendor',
          value: vendor.id,
          label: `Person: ${vendor.name} (${vendor.type})`,
          searchValue: `${vendor.name} ${vendor.type}`
        });
      }
    });

    // Amount suggestions
    if (!isNaN(parseFloat(searchValue))) {
      suggestions.push({
        type: 'amount',
        value: searchValue,
        label: `Amount: ${formatCurrency(parseFloat(searchValue))}`,
        searchValue: searchValue
      });
    }

    // Description suggestions from existing expenses
    const uniqueDescriptions = new Set(expenses.map(e => e.description).filter(Boolean));
    uniqueDescriptions.forEach(description => {
      if (description?.toLowerCase().includes(lowercaseSearch)) {
        suggestions.push({
          type: 'description',
          value: description,
          label: `Description: ${description}`,
          searchValue: description
        });
      }
    });

    return suggestions;
  };

  const handleSearchSelect = (suggestion: SearchSuggestion) => {
    setSearchDialogOpen(false);
    
    // Apply the selected filter
    switch (suggestion.type) {
      case 'category':
        setCategoryFilter(suggestion.value);
        break;
      case 'vendor':
        setVendorFilter(suggestion.value);
        break;
      case 'amount':
        const amount = parseFloat(suggestion.value);
        setMinAmount(amount.toString());
        setMaxAmount(amount.toString());
        break;
      case 'description':
        setSearchTerm(suggestion.value);
        break;
    }
  };

  // Export functionality
  const handleExport = async () => {
    try {
      setIsExporting(true);
      exportToCSV(expenses, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast({
        title: "Export Successful",
        description: "Your expenses have been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your expenses.",
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
        {/* Key Metrics - Stack on mobile, grid on larger screens */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spent</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(monthlySpent)}</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
              {monthlyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={clsx(
                "text-xl md:text-2xl font-bold",
                monthlyChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {monthlyChange.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                vs last month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Adjust height for mobile */}
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => 
                        window.innerWidth > 768 ? `${name} (${(percent * 100).toFixed(0)}%)` : `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={window.innerWidth > 768}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense List */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses List</CardTitle>
            <div className="space-y-4">
              {/* Search and Reset - Stack on mobile */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setSearchDialogOpen(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search expenses...</span>
                    <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>
                </div>
                <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Search Dialog */}
              <CommandDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
                <CommandInput 
                  placeholder="Search expenses..."
                  onValueChange={(search) => {
                    setSearchSuggestions(generateSearchSuggestions(search));
                  }}
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {searchSuggestions.length > 0 && (
                    <>
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
                    </>
                  )}
                  <CommandSeparator />
                  <CommandGroup heading="Tips">
                    <CommandItem>Search by category, person, amount, or description</CommandItem>
                    <CommandItem>Use ⌘+K to quickly open search</CommandItem>
                  </CommandGroup>
                </CommandList>
              </CommandDialog>

              {/* Filters - Stack on mobile, wrap on tablet+ */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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

                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All People</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>

                {/* Amount Range - Stack on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full sm:w-[120px]"
                  />
                  <span className="hidden sm:block">to</span>
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full sm:w-[120px]"
                  />
                </div>

                {/* Date Range - Stack on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-[160px]"
                  />
                  <span className="hidden sm:block">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-[160px]"
                  />
                </div>
              </div>

              {/* Filtered Total - Responsive layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="col-span-full lg:col-span-3">
                  <CardHeader className="py-2 px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block sm:inline">Total:</span>
                        <span className="text-lg font-bold ml-0 sm:ml-2 block sm:inline">
                          {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block sm:inline">Average:</span>
                        <span className="text-lg font-bold ml-0 sm:ml-2 block sm:inline">
                          {formatCurrency(filteredExpenses.length ? 
                            filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length : 0
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block sm:inline">Count:</span>
                        <span className="text-lg font-bold ml-0 sm:ml-2 block sm:inline">{filteredExpenses.length}</span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                <Button 
                  variant="outline" 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-[800px] px-4 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No expenses found</TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell className="capitalize">{expense.category}</TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell>{expense.vendor ? `${expense.vendor.name} (${expense.vendor.type})` : '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap",
                                {
                                  "bg-green-100 text-green-700": expense.amount < 1000,
                                  "bg-yellow-100 text-yellow-700": expense.amount >= 1000 && expense.amount < 5000,
                                  "bg-red-100 text-red-700": expense.amount >= 5000,
                                }
                              )}>
                                {expense.amount < 1000 ? "Low" : expense.amount < 5000 ? "Medium" : "High"}
                              </span>
                              <span className="whitespace-nowrap">{formatCurrency(expense.amount)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
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
                                    <AlertDialogAction onClick={() => deleteExpense(expense.id)} className="bg-red-500 hover:bg-red-600">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replace the floating action button with SpeedDial */}
        <SpeedDial
          onAddExpense={() => setIsAddingExpense(true)}
          onExport={handleExport}
        />

        {/* Add Expense Dialog */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid w-full items-center gap-2">
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
                              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    Add New Category
                  </Button>
                </div>

                <div className="grid w-full items-center gap-2">
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
                    onClick={() => setIsAddingVendor(true)}
                  >
                    Add New Person
                  </Button>
                </div>

                <div className="grid w-full items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDate ? format(new Date(newDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newDate ? new Date(newDate) : undefined}
                        onSelect={(date) => date && setNewDate(format(date, 'yyyy-MM-dd'))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="text"
                    placeholder="Enter date (e.g., 18/04/2024)"
                    onChange={(e) => {
                      const input = e.target.value;
                      const formats = [
                        'dd/MM/yyyy',
                        'dd-MM-yyyy',
                        'd/M/yyyy',
                        'dd/M/yyyy',
                        'd/MM/yyyy',
                        'yyyy-MM-dd'
                      ];

                      for (const dateFormat of formats) {
                        const parsedDate = parse(input, dateFormat, new Date());
                        if (isValid(parsedDate)) {
                          setNewDate(format(parsedDate, 'yyyy-MM-dd'));
                          break;
                        }
                      }
                    }}
                  />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingExpense(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Expense"
                  )}
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
                <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>
                  Add Category
                </Button>
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
              <Select value={newVendorType} onValueChange={(value: typeof VENDOR_TYPES[number]) => setNewVendorType(value)}>
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
                <Button variant="outline" onClick={() => setIsAddingVendor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVendor}>
                  Add Person
                </Button>
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

        {/* Export Button */}
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Export to CSV
            </>
          )}
        </Button>
      </div>

      <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateExpense} className="space-y-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={editingExpense?.amount || ""}
                  onChange={(e) => setEditingExpense(prev => prev ? {
                    ...prev,
                    amount: parseFloat(e.target.value)
                  } : null)}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Select 
                  value={editingExpense?.category || ""} 
                  onValueChange={(value) => setEditingExpense(prev => prev ? {
                    ...prev,
                    category: value
                  } : null)}
                >
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
                            {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-2">
                <Select 
                  value={editingExpense?.vendor_id || "none"} 
                  onValueChange={(value) => setEditingExpense(prev => prev ? {
                    ...prev,
                    vendor_id: value === "none" ? null : value
                  } : null)}
                >
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
              </div>

              <div className="grid w-full items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingExpense?.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingExpense?.date ? format(new Date(editingExpense.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editingExpense?.date ? new Date(editingExpense.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditingExpense(prev => prev ? {
                            ...prev,
                            date: format(date, 'yyyy-MM-dd')
                          } : null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="text"
                  placeholder="Enter date (e.g., 18/04/2024)"
                  onChange={(e) => {
                    const input = e.target.value;
                    let date: Date | null = null;

                    // Try parsing different date formats
                    const formats = [
                      'dd/MM/yyyy',
                      'dd-MM-yyyy',
                      'd/M/yyyy',
                      'dd/M/yyyy',
                      'd/MM/yyyy',
                      'yyyy-MM-dd' // ISO format
                    ];

                    for (const dateFormat of formats) {
                      const parsedDate = parse(input, dateFormat, new Date());
                      if (isValid(parsedDate)) {
                        date = parsedDate;
                        break;
                      }
                    }

                    if (date) {
                      setEditingExpense(prev => prev ? {
                        ...prev,
                        date: format(date!, 'yyyy-MM-dd')
                      } : null);
                    }
                  }}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Input
                  placeholder="Description"
                  value={editingExpense?.description || ""}
                  onChange={(e) => setEditingExpense(prev => prev ? {
                    ...prev,
                    description: e.target.value
                  } : null)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditingExpense(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 