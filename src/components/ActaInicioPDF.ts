import dayjs from "dayjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarActaPDF(form: any) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  let y = page.getHeight() - margin;

  page.drawText(`Panamá, ${dayjs(form.fecha).format("DD/MM/YYYY")}`, {
    x: margin,
    y,
    size: 11,
    font,
  });
  y -= 20;

  page.drawText("Señor(es)", { x: margin, y, size: 12, font: fontB });
  y -= 16;
  page.drawText(form.senores, { x: margin, y, size: 11, font });
  y -= 16;

  page.drawText(`RUC: ${form.ruc}`, { x: margin, y, size: 11, font });

  const bytes:any = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
