const format = require('date-format');
const fs = require('fs');
const { parse } = require('csv');
const { PDFDocument } = require('pdf-lib');
const slugify = require('slugify');

const PDFName = 'Glynwood New Product Formulation Statement NYF - Template.pdf';
const CSVName = 'products.csv';
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

const setStaticFields = (form) => {
  console.log('Setting static fields...');

  // Static fields
  const manufacturer = form.getTextField('Manufacturer');
  const ingredientOrigin = form.getTextField('Ingredient1Origin');
  const ingredientNYSWeight = form.getTextField('Ingredient1NYSWeight');
  const ingredientTotalWeight = form.getTextField('Ingredient1TotalWeight');
  const ingredientPercentNYS = form.getTextField('Ingredient1PercentNYS');
  const rawIngredientSource = form.getTextField('RawIngredient1Source');
  const rawIngredientLocation = form.getTextField('RawIngredient1Location');
  const rawIngredientMilesP2P = form.getTextField('RawIngredient1MilesP2P');
  const rawIngredientMilesP2F = form.getTextField('RawIngredient1MilesP2F');
  const intermediarySteps = form.getTextField('IntermediarySteps');
  const signerPrintedName = form.getTextField('SignerPrintedName');
  const date = form.getTextField('Date');
  const signerPhoneNumber = form.getTextField('SignerPhoneNumber');

  manufacturer.setText('The Glynwood Center');
  ingredientOrigin.setText('NY');
  ingredientNYSWeight.setText('100%');
  ingredientTotalWeight.setText('100%');
  ingredientPercentNYS.setText('100%');
  rawIngredientSource.setText('The Glynwood Center');
  rawIngredientLocation.setText('Cold Spring, NY');
  rawIngredientMilesP2P.setText('130');
  rawIngredientMilesP2F.setText('130');
  intermediarySteps.setText('Animals raised at The Glynwood Center in Cold Spring, NY were transported by Glynwood staff to the slaughterhouse, which is also in NY state. Animals were processed and butchered at the slaughterhouse. Meat was picked up by Glynwood staff and returned to the farm in Cold Spring, NY where it was sold direct to customer.');
  signerPrintedName.setText('Nicole Scott');
  date.setText(format('MM/dd/yy', new Date()));  
};

const setDynamicFields = (form, product) => {
  console.log(`Setting dynamic fields for product: ${product[1]}`);

  // Dynamic fields
  const productName = form.getTextField('ProductName');
  const ingredient = form.getTextField('Ingredient1');
  const rawIngredient = form.getTextField('RawIngredient1');

  productName.setText(product[1]);
  ingredient.setText(product[0]);
  rawIngredient.setText(product[0]);
};

async function main() {
  console.log('Starting PDF generation...');

  const products = await readCSV();
  const pdfDoc = await getPDFTemplate();
  const form = pdfDoc.getForm();

  setStaticFields(form);

  console.log(`Setting dynamic fields for ${products.length - 1} products...`);

  for (let i = 1; i < products.length; i++ ) {
    const product = products[i];
    const slug = slugify(product[0] + ' ' + product[1]);

    setDynamicFields(form, product);

    await savePDF(pdfDoc, `./outputs/${PDFName.replace('Template', slug)}`);
  }

  console.log(`Processed ${fileCount} PDFs!`);
}

main().catch((err) => console.error('Error:', err));
