import "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: import("jspdf-autotable").UserOptions) => jsPDF;
  }
}
