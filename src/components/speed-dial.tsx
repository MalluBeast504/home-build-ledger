import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  FileText,
  Calculator,
  Calendar,
  Settings,
  X,
} from "lucide-react";

interface SpeedDialProps {
  onAddExpense: () => void;
  onExport: () => void;
}

export function SpeedDial({ onAddExpense, onExport }: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <PlusCircle className="h-4 w-4" />, label: "Add Expense", onClick: onAddExpense },
    { icon: <FileText className="h-4 w-4" />, label: "Export", onClick: onExport },
    { icon: <Calculator className="h-4 w-4" />, label: "Calculator", onClick: () => {} },
    { icon: <Calendar className="h-4 w-4" />, label: "Calendar", onClick: () => {} },
    { icon: <Settings className="h-4 w-4" />, label: "Settings", onClick: () => {} },
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col-reverse gap-2">
      {isOpen && (
        <div className="flex flex-col gap-2 items-end">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg group relative"
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              {action.icon}
              <span className="absolute right-14 bg-popover text-popover-foreground px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      )}
      <Button
        size="icon"
        className="h-16 w-16 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-8 w-8" />
        ) : (
          <PlusCircle className="h-8 w-8" />
        )}
      </Button>
    </div>
  );
} 