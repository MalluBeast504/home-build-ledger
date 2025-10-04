import { useState } from "react";
import { Constants } from "@/integrations/supabase/types";
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
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { Vendor } from "@/types/expense";

interface ExpenseFiltersProps {
  categoryFilter: string;
 vendorFilter: string;
  vendorTypeFilter: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  onCategoryChange: (value: string) => void;
 onVendorChange: (value: string) => void;
 onVendorTypeChange: (value: string) => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onResetFilters: () => void;
  vendors: Vendor[];
  customCategories: string[];
  onSearchDialogOpen: () => void;
}

export function ExpenseFilters({
  categoryFilter,
  vendorFilter,
  vendorTypeFilter,
  minAmount,
  maxAmount,
  startDate,
  endDate,
  searchTerm,
  onCategoryChange,
  onVendorChange,
  onVendorTypeChange,
  onMinAmountChange,
  onMaxAmountChange,
  onStartDateChange,
  onEndDateChange,
  onSearchTermChange,
  onResetFilters,
  vendors,
  customCategories,
  onSearchDialogOpen,
}: ExpenseFiltersProps) {
  return (
    <div className="w-full">
      {/* Top bar with search and reset */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={onSearchDialogOpen}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchTermChange("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Button>
        </div>
        <Button variant="outline" onClick={onResetFilters} className="w-full sm:w-auto">
          Reset Filters
        </Button>
      </div>

      {/* Filter controls grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
              {customCategories.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Custom Categories</SelectLabel>
                  {customCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Person</Label>
          <Select value={vendorFilter} onValueChange={onVendorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
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
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={vendorTypeFilter} onValueChange={onVendorTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="labour">Labour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Amount Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => onMinAmountChange(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}