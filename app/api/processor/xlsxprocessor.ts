import * as ExcelJS from "exceljs";
import * as XLSX from "xlsx"
import pl from "nodejs-polars";
import { Buffer } from "node:buffer";
import { Stream } from "node:stream";
import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

export const excelToCsv = async (fileBuffer: ArrayBuffer) => {
  const readbook = XLSX.read(fileBuffer);

  const firstSheetName = readbook.SheetNames[0];
  const worksheet = readbook.Sheets[firstSheetName];

  const csv = XLSX.utils.sheet_to_csv(worksheet);

  return Buffer.from(csv, 'utf-8');
};

export const processCsvToDf = async (csvBuffer: Buffer) => {
  const df = pl.readCSV(csvBuffer);
  const requiredColumns = [
    "外部注文番号",
    "荷受け人",
    "備考",
    "商品コード",
    "商品名称",
    "ユーザー購入数量",
    "ピッキング数量",
    "欠品数量",
    "代替品数量",
    "商品価格",
    "商品ステータス",
    "代替商品コード",
    "代替商品名称",
    "明細修正",
  ];

  // 必須カラムが存在するかを確認
  const missingColumns = requiredColumns.filter(col => !df.columns.includes(col));
  if (missingColumns.length > 0) {
    throw new Error('アップロードするファイルを確認してください');
  }
  try {
    const df_processed = df
      .select(...requiredColumns)
      .filter(pl.col("明細修正").eq(pl.lit("有")));

    return df_processed;
  } catch (error) {
    console.error(error);
    throw new Error('アップロードするファイルを確認してください');
  }
}

export const dfToExcel = async(df: pl.DataFrame) => {
  let csvBuffer: Buffer = Buffer.alloc(0);
  const writeStream = new Stream.Writable({
    write(chunk, _, callback) {
      csvBuffer = Buffer.concat([csvBuffer, chunk]); // chunkをバッファに追加
      callback();
    },
  });
  df.writeCSV(writeStream);

  // Readableストリームを生成してExcelJSで読み込む
  const readableStream = Stream.Readable.from(csvBuffer.toString('utf-8')); // BufferからReadableストリームに変換
  const workbook = new ExcelJS.Workbook();
  await workbook.csv.read(readableStream);
  const worksheet = workbook.getWorksheet(1);
  
  const barcodes = df.select("商品コード").toSeries();
  const imageWidth = 150;
  const imageHeight = 50;
  const widthPoints = imageWidth / 7.5; // Excel列幅の単位調整
  const heightPoints = imageHeight * 0.75 + 10; // 行高さに変換

  let rowIndex = 1;
  if (!worksheet) return;
  worksheet.getCell('O1').value = 'バーコード';
  worksheet.getColumn('O').width = widthPoints;

  for (const barcode of barcodes) {

    const barcodeStr = barcode.toString();
    const barcodeBuffer = generateBarcodeBuffer(barcodeStr, imageWidth, imageHeight);
    insertImageToCell(
      workbook,
      worksheet,
      barcodeBuffer as unknown as ExcelJS.Buffer,
      14,
      rowIndex,
      imageWidth,
      imageHeight,
      heightPoints
    );

    rowIndex += 1;
  }


  return await workbook.xlsx.writeBuffer();
}

const generateBarcodeBuffer = (barcode: string, height: number, width: number) => {
  const canvas = createCanvas(width, height);
  JsBarcode(canvas, barcode, {
    format: "CODE128",
    displayValue: false
  });
  return canvas.toBuffer("image/png");
}

const insertImageToCell = (
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  buffer: ExcelJS.Buffer,
  col: number,
  row: number,
  imageWidth: number,
  imageHeight: number,
  heightPoints: number
) => {
  const imageId = workbook.addImage({
    buffer: buffer,
    extension: 'png',
  });

  worksheet.getRow(row + 1).height = heightPoints; // セル高さ
  worksheet.addImage(imageId, {
    tl: { col: col, row: row }, // 挿入位置
    ext: { width: imageWidth, height: imageHeight }, // 画像サイズ
  });
}