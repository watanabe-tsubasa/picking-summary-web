import * as ExcelJS from "exceljs";
import * as XLSX from "xlsx"
import pl from "nodejs-polars";
import { Buffer } from "node:buffer";
import { createCanvas } from "@napi-rs/canvas";
import JsBarcode from "jsbarcode";
import { schema } from "./csvSchema";
import { getHours } from "./getHours";

export const excelToCsv = async (fileBuffer: ArrayBuffer) => {
  const readbook = XLSX.read(fileBuffer);

  const firstSheetName = readbook.SheetNames[0];
  const worksheet = readbook.Sheets[firstSheetName];

  const csv = XLSX.utils.sheet_to_csv(worksheet);

  return Buffer.from(csv, 'utf-8');
};

export const processCsvToDf = async (csvBuffer: Buffer) => {
  const df = pl.readCSV(csvBuffer, {
    schema: schema
  });
  // console.log(df);
  const requiredColumns = [
    "配送時間", // A 1
    "外部注文番号", //
    "荷受け人", // C 3
    "備考", // 
    "商品コード", // E 5
    "商品名称", //
    "ユーザー購入数量", // G 7
    "ピッキング数量", //
    "欠品数量", // I 9
    "代替品数量", //
    "商品価格", // K 11
    "商品ステータス", //
    "代替商品コード", // M 13
    "代替商品名称", //
    "明細修正", // O 15
  ];
  // 必須カラムが存在するかを確認
  const missingColumns = requiredColumns.filter(col => !df.columns.includes(col));
  if (missingColumns.length > 0) {
    throw new Error('アップロードするファイルを確認してください');
  }
  try {

    let df_processed = df
      .select(...requiredColumns)
      .filter(pl.col("明細修正").eq(pl.lit("有")));

    const createTimeRow = (series: pl.Series) => {
      return series.toArray().map(elem => getHours(elem as string))
    }
    df_processed = df_processed
      .withColumn(
        pl.Series(createTimeRow(df_processed.select('配送時間').toSeries())).alias('配送時間')
      )
      .sort(['配送時間', '外部注文番号'])
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

  const imageWidth = 150;
  const imageHeight = 50;
  const widthPoints = imageWidth / 7.5; // Excel列幅の単位調整
  const heightPoints = imageHeight * 0.75 + 10; // 行高さに変換

  const codeColNames = ['商品コード', '代替商品コード']
  const updatedColumns = dfColumns.reduce<{ name: string }[]>((acc, colName) => {
    acc.push({ name: colName });
    if (codeColNames.includes(colName)) {
      acc.push({ name: `${colName.replace('商品コード', '')}バーコード`});
    }
    return acc;
  }, [])

  const updatedRows = dfRows.map(row => {
    const newRow = [...dfColumns.map(col => row[col])];
    for (const insertAfterColName of codeColNames.toReversed()) {
      newRow.splice(dfColumns.indexOf(insertAfterColName) + 1, 0, null)
    }
    return newRow;
  });

  worksheet.addTable({
    name: 'MyTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleLight1',
      showRowStripes: true,
    },
    columns: updatedColumns,
    rows: updatedRows,
  });

  const barcodeCols = updatedColumns
    .filter(elem => elem.name.match('バーコード'))
    .map(elem => ({
      name: elem.name,
      num: updatedColumns.indexOf(elem)
    }));
  // console.log(barcodeCols)

  const lastRowNum = df.shape.height + 1;

  for (const barcodeCol of barcodeCols) {
    
    const barcodes = df.select(`${barcodeCol.name.replace('バーコード', '商品コード')}`).toSeries();
    let rowIndex = 1;
    for (const barcode of barcodes) {
      let barcodeStr: string;
      try {
        barcodeStr = barcode?.toString() ?? ''; // null または undefined の場合は空文字列を使用
        if (!barcodeStr) {
          // console.warn(`Invalid barcode value at row ${rowIndex}: ${barcode}`);
          rowIndex += 1;
          continue; // スキップして次の行へ
        }
        const barcodeBuffer = generateBarcodeBuffer(barcodeStr, imageWidth, imageHeight);
        insertImageToCell(
          workbook,
          worksheet,
          barcodeBuffer as unknown as ExcelJS.Buffer,
          barcodeCol.num,
          rowIndex,
          imageWidth,
          imageHeight,
          heightPoints
        );
      } catch (error) {
        console.error(`Error processing barcode at row ${rowIndex}:`, error);
      }
      rowIndex += 1;
    }
  }
  setWorksheetProps(
    worksheet,
    lastRowNum,
    barcodeCols.map(elem => elem.num), // barcodeColsが0始まりで数えているが、ここの引数は1始まりで取得するため調整不要
    widthPoints,
  ); // エクセルの印刷範囲などセット
  return await workbook.xlsx.writeBuffer();
}

const generateBarcodeBuffer = (
  barcode: string,
  height: number,
  width: number
) => {
  const canvas = createCanvas(width, height);
  if (barcode.startsWith("00000")) {
    barcode = barcode.slice(5);
  }
  const format = barcode.length === 8 ? "EAN8" : "EAN13";

  JsBarcode(canvas, barcode, {
    format: format,
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

const setWorksheetProps = (
  worksheet: ExcelJS.Worksheet,
  lastRowNum: number,
  numberCols: number[], // JANコードが記載されている列番号
  widthPoints: number // バーコードの横幅
) => {
  worksheet.pageSetup.printArea = `A1:Q${lastRowNum}`
  worksheet.pageSetup.printTitlesRow = '1:1';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1; // 横幅を合わせる
  worksheet.pageSetup.fitToHeight = 0; // 縦方向枚数は無視
  worksheet.pageSetup.orientation = 'landscape'; // 横向き
  setWorksheetFont(worksheet, 'Meiryo UI');
  adjustWorksheet(worksheet, numberCols, widthPoints);
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
  numberColIndexs: number[],
  widthPoints: number
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

    const barcodeColIndexes = numberColIndexs.map(elem => elem + 1);
    if (barcodeColIndexes.includes(colIdx)) {
      worksheet.getColumn(colIdx).width = widthPoints;
    } else {
      const margin = numberColIndexs.includes(colIdx) ? 8 : 4
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
    }
  });
};

const setNumberFormatForColumns = (
  worksheet: ExcelJS.Worksheet,
  numberColIndexs: number[],
  numberFormat: string
) => {
  numberColIndexs.forEach((colNumber) => {
    const column = worksheet.getColumn(colNumber);
    column.eachCell((cell) => {
      // 数値書式を設定
      cell.numFmt = numberFormat;
    });
  });
};