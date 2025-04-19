import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  PlusCircle,
  Search,
  FileText,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette({
  open,
  setOpen,
  onAddExpense,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAddExpense: () => void;
}) {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { onAddExpense(); setOpen(false); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Expense
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tools">
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4" />
            Calculator
          </CommandItem>
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 h-4 w-4" />
            Export Data
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
} 