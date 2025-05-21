import { NextRequest, NextResponse } from "next/server";
import { dfToExcel, excelToCsv, processCsvToDf } from "./xlsxprocessor";

export const config = {
  api: {
    bodyParser: false, // MulterやBufferを使うためbodyParserを無効化
  },
};

export const POST = async (req: NextRequest): Promise<NextResponse<Buffer | { message: string }>> => {
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
    if (df.height === 0) {
      return new NextResponse(JSON.stringify({ message: '欠品代替処理は実施されていない、もしくは異なる形式のファイルです。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    console.error('Error type:', typeof error, error?.constructor?.name);
    return new NextResponse(JSON.stringify({
      message: error instanceof Error ? error.message : 'ファイルの処理に失敗しました'
     }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}