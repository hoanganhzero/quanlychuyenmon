import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { phanTichExcel } from "@/lib/excel-parse";

export async function POST(req: Request) {
  const session = await getSession();
  if (
    !session ||
    !["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro)
  ) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Chưa chọn file." }, { status: 400 });
  }
  const tenFile = file.name.toLowerCase();
  if (!tenFile.endsWith(".xlsx") && !tenFile.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Chỉ chấp nhận file Excel (.xlsx, .xls)." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ketQua = phanTichExcel(buffer);
    return NextResponse.json(ketQua);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi đọc file." },
      { status: 400 }
    );
  }
}
