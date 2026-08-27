import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import FormBuilder from "@/components/form-builder";
import { PageHeader } from "@/components/ui";

export default async function TaoMoiBaoCaoMauPage() {
  const session = await getSession();
  if (!session) return null;

  if (!["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tạo mẫu báo cáo" />
        <p className="text-sm text-gray-500">
          Chỉ Tổ trưởng chuyên môn và Ban Giám đốc có quyền tạo form.
        </p>
      </div>
    );
  }

  const tos = await db.toChuyenMon.findMany({
    orderBy: { ten: "asc" },
    select: { id: true, ten: true },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="🤖 AI tạo form từ Excel"
        description="Tải file Excel lên — hệ thống tự nhận diện các cột thành trường nhập liệu, sau đó gửi đến đúng nhóm giáo viên"
      />
      <FormBuilder tos={tos} />
    </div>
  );
}
