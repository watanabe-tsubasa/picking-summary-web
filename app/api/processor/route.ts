import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const tagName = await req.json()
  console.log(tagName);
  return NextResponse.json({
    success: true,
    message: 'OK'
  })
}