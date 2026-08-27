import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import FormBuilder, { type BuilderInitial } from "@/components/form-builder";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuaMauBaoCaoPage({
  params,
}: PageProps<"/bao-cao-mau/[id]/sua">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const mau = await db.mauBaoCao.findUnique({
    where: { id },
    include: { fields: { orderBy: { thuTu: "asc" } } },
  });
  if (!mau) notFound();
  if (mau.trangThai !== "NHAP") {
    return (
      <div className="space-y-6 max-w-3xl">
        <Link href={`/bao-cao-mau/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Quay lại
        </Link>
        <PageHeader title={mau.tieuDe} />
        <p className="text-sm text-gray-500">
          Form đã phát hành nên không thể chỉnh sửa nội dung.
        </p>
      </div>
    );
  }

  const tos = await db.toChuyenMon.findMany({
    orderBy: { ten: "asc" },
    select: { id: true, ten: true },
  });

  const initial: BuilderInitial = {
    id: mau.id,
    tieuDe: mau.tieuDe,
    moTa: mau.moTa ?? "",
    hanChot: mau.hanChot ? new Date(mau.hanChot).toISOString().slice(0, 10) : "",
    doiTuong: mau.doiTuong,
    toChuyenMonId: mau.toChuyenMonId ?? "",
    fields: mau.fields.map((f) => ({
      tenTruong: f.tenTruong,
      kieuDuLieu: f.kieuDuLieu,
      luaChon: f.luaChon,
      batBuoc: f.batBuoc,
    })),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href={`/bao-cao-mau/${id}`} className="text-sm text-blue-600 hover:underline">
        ← Quay lại
      </Link>
      <PageHeader title="Chỉnh sửa form báo cáo" />
      <FormBuilder tos={tos} initial={initial} />
    </div>
  );
}
