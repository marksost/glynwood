const format = require('date-format');
const fs = require('fs');
const { parse } = require('csv');
const { PDFDocument } = require('pdf-lib');
const slugify = require('slugify');

const PDFName = 'Glynwood Center Label - Template.pdf';
const CSVName = 'cuts.csv';
let fileCount = 0;

const readCSV = async () => {
  console.log(`Reading CSV: ${CSVName}`);

  const records = [];
  const parser = fs.createReadStream(`./${CSVName}`).pipe(parse({}));

  for await (const record of parser) {
    records.push(record);
  }

  return records;
};

const getPDFTemplate = async () => {
  console.log(`Reading PDF: ${PDFName}`);

  const file = fs.readFileSync(`./${PDFName}`, null);
  return await PDFDocument.load(file);
};

const savePDF = async (pdfDoc, path) => {
  console.log(`Saving PDF file: ${path}`);

  const filledFormBytes = await pdfDoc.save();
  fs.writeFileSync(path, filledFormBytes);

  fileCount++;

  console.log('PDF saved successfully!');
};

const setDynamicFields = (form, cut) => {
  console.log(`Setting dynamic fields for cut: ${cut[0]}`);

  // Dynamic fields
  const productName = form.getTextField('ProductName');
  const weight = form.getTextField('Weight');

  productName.setText(cut[0].toUpperCase());
  weight.setText(cut[1]);
};

async function main() {
  console.log('Starting PDF generation...');

  const cuts = await readCSV();
  const pdfDoc = await getPDFTemplate();
  const form = pdfDoc.getForm();

  console.log(`Setting dynamic fields for ${cuts.length - 1} cuts...`);

  for (let i = 1; i < cuts.length; i++ ) {
    const cut = cuts[i];
    const slug = slugify(cut[0]);

    setDynamicFields(form, cut);

    await savePDF(pdfDoc, `./outputs/${PDFName.replace('Template', slug)}`);
  }

  console.log(`Processed ${fileCount} PDFs!`);
}

main().catch((err) => console.error('Error:', err));
