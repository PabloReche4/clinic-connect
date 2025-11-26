import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface BudgetPDFData {
  budget_number?: string;
  patient_name: string;
  created_at: string;
  valid_until: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  items: BudgetItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface InvoicePDFData {
  invoice_number: string;
  patient_name: string;
  created_at: string;
  payment_date: string | null;
  status: string;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  items: InvoiceItem[];
}

export const generateBudgetPDF = (data: BudgetPDFData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PRESUPUESTO", 105, 20, { align: "center" });
  
  // Clinic info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Clínica Dental", 20, 35);
  
  // Budget details
  doc.setFontSize(10);
  let yPos = 50;
  
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient_name, 60, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.created_at), "d 'de' MMMM, yyyy", { locale: es }), 60, yPos);
  
  if (data.valid_until) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Válido hasta:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(data.valid_until), "d 'de' MMMM, yyyy", { locale: es }), 60, yPos);
  }
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Estado:", 20, yPos);
  doc.setFont("helvetica", "normal");
  const statusText = data.status === "pending" ? "Pendiente" : data.status === "approved" ? "Aprobado" : "Rechazado";
  doc.text(statusText, 60, yPos);
  
  // Items table
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Tratamiento", 20, yPos);
  doc.text("Cant.", 110, yPos);
  doc.text("Precio", 135, yPos);
  doc.text("Subtotal", 165, yPos);
  
  yPos += 2;
  doc.line(20, yPos, 190, yPos);
  yPos += 5;
  
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(item.description, 20, yPos);
    doc.text(item.quantity.toString(), 110, yPos);
    doc.text(`€${item.unit_price.toFixed(2)}`, 135, yPos);
    doc.text(`€${item.subtotal.toFixed(2)}`, 165, yPos);
    yPos += 7;
  });
  
  // Total
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 135, yPos);
  doc.text(`€${data.total_amount.toFixed(2)}`, 165, yPos);
  
  // Notes
  if (data.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.text("Notas:", 20, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  doc.save(`presupuesto-${data.patient_name.replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`);
};

export const generateInvoicePDF = (data: InvoicePDFData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", 105, 20, { align: "center" });
  
  // Clinic info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Clínica Dental", 20, 35);
  
  // Invoice details
  doc.setFontSize(10);
  let yPos = 50;
  
  doc.setFont("helvetica", "bold");
  doc.text("Nº Factura:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoice_number, 60, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient_name, 60, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.created_at), "d 'de' MMMM, yyyy", { locale: es }), 60, yPos);
  
  if (data.payment_date) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Pago:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(data.payment_date), "d 'de' MMMM, yyyy", { locale: es }), 60, yPos);
  }
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Estado:", 20, yPos);
  doc.setFont("helvetica", "normal");
  const statusText = data.status === "pending" ? "Pendiente" : data.status === "paid" ? "Pagada" : "Cancelada";
  doc.text(statusText, 60, yPos);
  
  if (data.payment_method) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Método de Pago:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.payment_method, 60, yPos);
  }
  
  // Items table
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", 20, yPos);
  doc.text("Cant.", 110, yPos);
  doc.text("Precio", 135, yPos);
  doc.text("Subtotal", 165, yPos);
  
  yPos += 2;
  doc.line(20, yPos, 190, yPos);
  yPos += 5;
  
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(item.description, 20, yPos);
    doc.text(item.quantity.toString(), 110, yPos);
    doc.text(`€${item.unit_price.toFixed(2)}`, 135, yPos);
    doc.text(`€${item.subtotal.toFixed(2)}`, 165, yPos);
    yPos += 7;
  });
  
  // Total
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 135, yPos);
  doc.text(`€${data.total_amount.toFixed(2)}`, 165, yPos);
  
  // Notes
  if (data.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.text("Notas:", 20, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  doc.save(`factura-${data.invoice_number}-${format(new Date(), "yyyyMMdd")}.pdf`);
};
