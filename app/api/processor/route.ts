import { NextRequest, NextResponse } from "next/server";
import { dfToExcel, excelToCsv, processCsvToDf } from "./xlsxprocessor";

export const config = {
  api: {
    bodyParser: false, // MulterやBufferを使うためbodyParserを無効化
  },
};

export const POST = async (req: NextRequest) => {
  try {
    // ファイルデータをバッファとして受け取る
    const formData = await req.formData();
    const files = formData.getAll('files') as Blob[] | null;

    if (files?.length === 0 || !files) {
      return new NextResponse(JSON.stringify({ message: 'ファイルが見つかりませんでした' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await files[0].arrayBuffer();
    // const fileBuffer = Buffer.from(arrayBuffer);

    const csvBuffer = await excelToCsv(arrayBuffer)
    const df = await processCsvToDf(csvBuffer);
    const resultExcel = await dfToExcel(df);

    // ファイルのダウンロードレスポンスを設定して返却
    return new NextResponse(resultExcel, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename=uploaded_file.xlsx',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('File processing error:', error);
    return new NextResponse(JSON.stringify({ message: 'ファイルの処理に失敗しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}