import * as ExcelJS from "exceljs";
import * as XLSX from "xlsx"
import pl from "nodejs-polars";
import { Buffer } from "node:buffer";
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
    "外部注文番号", // A 1
    "荷受け人", // B 2
    "備考", // C 3
    "商品コード", // D 4
    "商品名称", // E 5
    "ユーザー購入数量", // F 6
    "ピッキング数量", // G 7
    "欠品数量", // H 8
    "代替品数量", // I 9
    "商品価格", // J 10
    "商品ステータス", // K 11
    "代替商品コード", // L 12
    "代替商品名称", // M 13
    "明細修正", // N 14
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
  const dfColumns = df.columns;
  const dfRows = df.toRecords()
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  const barcodes = df.select("商品コード").toSeries();
  const imageWidth = 150;
  const imageHeight = 50;
  const widthPoints = imageWidth / 7.5; // Excel列幅の単位調整
  const heightPoints = imageHeight * 0.75 + 10; // 行高さに変換

  worksheet.addTable({
    name: 'MyTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleLight1',
      showRowStripes: true,
    },
    columns: [...dfColumns.map(name => ({name: name})), {name: 'バーコード'}],
    rows: dfRows.map(row => dfColumns.map(col => row[col])),
  });

  let rowIndex = 1;
  worksheet.getColumn('O').width = widthPoints;

  const lastRowNum = df.shape.height;

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
  setWorksheetProps(worksheet, lastRowNum); // エクセルの印刷範囲などセット
  return await workbook.xlsx.writeBuffer();
}

const generateBarcodeBuffer = (barcode: string, height: number, width: number) => {
  const canvas = createCanvas(width, height);
  JsBarcode(canvas, barcode, {
    format: "CODE128",
    displayValue: true
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

const setWorksheetProps = (worksheet: ExcelJS.Worksheet, lastRowNum: number) => {
  const numberCols = [4, 12]
  worksheet.pageSetup.printArea = `A1:O${lastRowNum}`
  worksheet.pageSetup.printTitlesRow = '1:1';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1; // 横幅を合わせる
  worksheet.pageSetup.fitToHeight = 0; // 縦方向枚数は無視
  worksheet.pageSetup.orientation = 'landscape'; // 横向き
  setWorksheetFont(worksheet, 'Meiryo UI');
  adjustWorksheet(worksheet, numberCols);
  worksheet.pageSetup.margins = {
    left: 0.1,    // 左余白
    right: 0.1,   // 右余白
    top: 0.2,     // 上余白
    bottom: 0.2,  // 下余白
    header: 0.1,  // ヘッダー余白
    footer: 0.1   // フッター余白
  };
  worksheet.pageSetup.paperSize = 9; // A4
  setNumberFormatForColumns(worksheet, numberCols, '0');
}

const setWorksheetFont = (worksheet: ExcelJS.Worksheet, fontName: string) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.font = { name: fontName };
    });
  });
};

const adjustWorksheet = (
  worksheet: ExcelJS.Worksheet,
  columnNumbers: number[]
) => {
  // 全セルの「折り返して全体を表示」設定
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { wrapText: true };
    });
  });

  // 各列の幅を自動調整
  worksheet.columns.forEach((_, colIdx) => {
    if (!colIdx) return
    const margin = columnNumbers.includes(colIdx) ? 8 : 4
    let maxLength = 1; // 最小列幅を設定
    const column = worksheet.getColumn(colIdx);
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : '';
      const cellLength = cellValue.length;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = (maxLength <= 30) ? maxLength + margin : 30; // 余白を考慮して列幅を設定
  });
};

const setNumberFormatForColumns = (
  worksheet: ExcelJS.Worksheet,
  columnNumbers: number[],
  numberFormat: string
) => {
  columnNumbers.forEach((colNumber) => {
    const column = worksheet.getColumn(colNumber);
    column.eachCell((cell) => {
      // 数値書式を設定
      cell.numFmt = numberFormat;
    });
  });
};