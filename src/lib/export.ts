import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "@/types/expense"; // Import the Expense interface

// Function to format currency
const formatCurrency = (amount: number) => {
  // Using the '₹' symbol directly
  return '₹' + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function exportToCSV(data: Expense[], filename: string) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          let cell = (row as any)[header]; // Cast to any to access properties dynamically
          // Handle objects (like vendor)
          if (typeof cell === "object" && cell !== null) {
            cell = cell.name || JSON.stringify(cell);
          }
          // Escape commas and quotes
          cell = String(cell).replace(/"/g, '""');
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export async function exportToPDF(data: Expense[], filename: string) {
  console.log("Starting PDF export...");
  console.log("Received data:", data);

  const doc = new jsPDF();

  // Load font
  const fontUrl = '/fonts/NotoSansMalayalam-VariableFont_wdth,wght.ttf';
  const fontResponse = await fetch(fontUrl);
  const font = await fontResponse.arrayBuffer();
  const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  
  doc.addFileToVFS('NotoSansMalayalam.ttf', fontBase64);
  doc.addFont('NotoSansMalayalam.ttf', 'NotoSansMalayalam', 'normal');
  doc.setFont('NotoSansMalayalam');

  // Add title
  doc.setFontSize(18);
  doc.text("Expenses Report", 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Prepare table data with headers
  if (data && data.length > 0) {
    const headers = ["Date", "Category", "Description", "Person", "Amount"];

    const tableData = data.map((row: Expense) => [
      row.date ? new Date(row.date).toLocaleDateString() : "",
      row.category
        ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
        : "",
      row.description || "-",
      row.vendor ? `${row.vendor.name || ""} (${row.vendor.type || ""})` : "-",
      formatCurrency(row.amount || 0),
    ]);

    console.log("Headers for PDF:", headers);
    console.log("Table data for PDF:", tableData);

    // Add table using autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        font: "NotoSansMalayalam",
        fontSize: 10,
      },
      headStyles: {
        fillColor: [41, 128, 185], // Blue color for header
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray for alternate rows
      },
    });
  } else {
    console.warn("No data to export to PDF.");
  }

  // Save the PDF
  doc.save(filename);
  console.log("PDF export finished.");
}
