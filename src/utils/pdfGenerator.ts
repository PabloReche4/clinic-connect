import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Logo base64 will be loaded dynamically
import clinicaLogo from "@/assets/clinica-dental-reche-logo.jpg";

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

const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

const addHeader = async (doc: jsPDF) => {
  try {
    const logoBase64 = await loadImageAsBase64(clinicaLogo);
    doc.addImage(logoBase64, "JPEG", 20, 10, 25, 25);
  } catch {
    // If logo fails to load, continue without it
  }

  // Clinic name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34); // Green color
  doc.text("Clínica Dental Reche", 50, 20);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Tu sonrisa, nuestra prioridad", 50, 27);
  
  // Contact info
  doc.setFontSize(8);
  doc.text("Tel: (+34) 640 656 956 | dentalreche@gmail.com", 50, 33);
  
  // Decorative line
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  
  doc.setTextColor(0, 0, 0); // Reset to black
};

export const generateBudgetPDF = async (data: BudgetPDFData) => {
  const doc = new jsPDF();
  
  // Header with logo
  await addHeader(doc);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text("PRESUPUESTO", 105, 52, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  
  // Budget details box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 58, 170, 35, 3, 3, "FD");
  
  doc.setFontSize(10);
  let yPos = 66;
  
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 25, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient_name, 55, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 110, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.created_at), "d 'de' MMMM, yyyy", { locale: es }), 130, yPos);
  
  yPos += 8;
  if (data.valid_until) {
    doc.setFont("helvetica", "bold");
    doc.text("Válido hasta:", 25, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(data.valid_until), "d 'de' MMMM, yyyy", { locale: es }), 55, yPos);
  }
  
  doc.setFont("helvetica", "bold");
  doc.text("Estado:", 110, yPos);
  doc.setFont("helvetica", "normal");
  const statusText = data.status === "pending" ? "Pendiente" : data.status === "approved" ? "Aprobado" : "Rechazado";
  doc.text(statusText, 130, yPos);
  
  // Items table header
  yPos = 102;
  doc.setFillColor(34, 139, 34);
  doc.rect(20, yPos - 6, 170, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Tratamiento", 25, yPos);
  doc.text("Cant.", 115, yPos);
  doc.text("Precio", 140, yPos);
  doc.text("Subtotal", 170, yPos);
  
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  
  // Items
  doc.setFont("helvetica", "normal");
  let alternateRow = false;
  data.items.forEach((item) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    if (alternateRow) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 5, 170, 8, "F");
    }
    alternateRow = !alternateRow;
    
    const description = item.description.length > 45 ? item.description.substring(0, 42) + "..." : item.description;
    doc.text(description, 25, yPos);
    doc.text(item.quantity.toString(), 115, yPos);
    doc.text(`€${item.unit_price.toFixed(2)}`, 140, yPos);
    doc.text(`€${item.subtotal.toFixed(2)}`, 170, yPos);
    yPos += 8;
  });
  
  // Total box
  yPos += 5;
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(120, yPos - 5, 70, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 125, yPos + 3);
  doc.text(`€${data.total_amount.toFixed(2)}`, 175, yPos + 3);
  
  doc.setTextColor(0, 0, 0);
  
  // Notes
  if (data.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Clínica Dental Reche - Este presupuesto tiene carácter informativo", 105, pageHeight - 15, { align: "center" });
  doc.text(`Generado el ${format(new Date(), "d/MM/yyyy 'a las' HH:mm", { locale: es })}`, 105, pageHeight - 10, { align: "center" });
  
  doc.save(`presupuesto-${data.patient_name.replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`);
};

export const generateInvoicePDF = async (data: InvoicePDFData) => {
  const doc = new jsPDF();
  
  // Header with logo
  await addHeader(doc);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text("FACTURA", 105, 52, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  
  // Invoice details box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 58, 170, 42, 3, 3, "FD");
  
  doc.setFontSize(10);
  let yPos = 66;
  
  doc.setFont("helvetica", "bold");
  doc.text("Nº Factura:", 25, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34, 139, 34);
  doc.text(data.invoice_number, 55, yPos);
  doc.setTextColor(0, 0, 0);
  
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 110, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(data.created_at), "d 'de' MMMM, yyyy", { locale: es }), 130, yPos);
  
  yPos += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 25, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient_name, 55, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.text("Estado:", 110, yPos);
  doc.setFont("helvetica", "normal");
  const statusText = data.status === "pending" ? "Pendiente" : data.status === "paid" ? "Pagada" : "Cancelada";
  doc.text(statusText, 130, yPos);
  
  yPos += 8;
  if (data.payment_date) {
    doc.setFont("helvetica", "bold");
    doc.text("Fecha Pago:", 25, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(data.payment_date), "d 'de' MMMM, yyyy", { locale: es }), 55, yPos);
  }
  
  if (data.payment_method) {
    doc.setFont("helvetica", "bold");
    doc.text("Método:", 110, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.payment_method, 130, yPos);
  }
  
  // Items table header
  yPos = 110;
  doc.setFillColor(34, 139, 34);
  doc.rect(20, yPos - 6, 170, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", 25, yPos);
  doc.text("Cant.", 115, yPos);
  doc.text("Precio", 140, yPos);
  doc.text("Subtotal", 170, yPos);
  
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  
  // Items
  doc.setFont("helvetica", "normal");
  let alternateRow = false;
  data.items.forEach((item) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    if (alternateRow) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 5, 170, 8, "F");
    }
    alternateRow = !alternateRow;
    
    const description = item.description.length > 45 ? item.description.substring(0, 42) + "..." : item.description;
    doc.text(description, 25, yPos);
    doc.text(item.quantity.toString(), 115, yPos);
    doc.text(`€${item.unit_price.toFixed(2)}`, 140, yPos);
    doc.text(`€${item.subtotal.toFixed(2)}`, 170, yPos);
    yPos += 8;
  });
  
  // Total box
  yPos += 5;
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(120, yPos - 5, 70, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 125, yPos + 3);
  doc.text(`€${data.total_amount.toFixed(2)}`, 175, yPos + 3);
  
  doc.setTextColor(0, 0, 0);
  
  // Notes
  if (data.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Clínica Dental Reche - Documento válido a efectos fiscales", 105, pageHeight - 15, { align: "center" });
  doc.text(`Generado el ${format(new Date(), "d/MM/yyyy 'a las' HH:mm", { locale: es })}`, 105, pageHeight - 10, { align: "center" });
  
  doc.save(`factura-${data.invoice_number}-${format(new Date(), "yyyyMMdd")}.pdf`);
};
