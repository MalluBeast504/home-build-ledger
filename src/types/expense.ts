export interface Expense {
  id: string;
  amount: number;
  category: string;
 date: string;
  description: string;
  vendor: { name: string; type: string; id: string } | null;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
}