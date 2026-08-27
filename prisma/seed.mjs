import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Đang tạo dữ liệu mẫu...");

  // ---- Tài khoản quản trị ----
  const matKhauHash = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@truonghoc.edu.vn" },
    update: {},
    create: {
      email: "admin@truonghoc.edu.vn",
      matKhau: matKhauHash,
      hoTen: "Quản trị viên",
      vaiTro: "ADMIN",
    },
  });

  // ---- Năm học & học kỳ ----
  const namHoc = await db.namHoc.upsert({
    where: { ten: "2026-2027" },
    update: { dangHoatDong: true },
    create: {
      ten: "2026-2027",
      ngayBatDau: new Date("2026-09-05"),
      ngayKetThuc: new Date("2027-05-31"),
      dangHoatDong: true,
    },
  });

  const hk1 = await db.hocKy.upsert({
    where: { namHocId_thuTu: { namHocId: namHoc.id, thuTu: 1 } },
    update: { dangChay: true },
    create: { ten: "Học kỳ I", thuTu: 1, namHocId: namHoc.id, dangChay: true },
  });
  await db.hocKy.upsert({
    where: { namHocId_thuTu: { namHocId: namHoc.id, thuTu: 2 } },
    update: {},
    create: { ten: "Học kỳ II", thuTu: 2, namHocId: namHoc.id },
  });
  void hk1;

  // ---- Môn học ----
  const mons = [
    ["TV", "Tiếng Việt"],
    ["TOAN", "Toán"],
    ["TNXH", "Tự nhiên và Xã hội"],
    ["LSDI", "Lịch sử và Địa lí"],
    ["DD", "Đạo đức"],
    ["TA", "Tiếng Anh"],
    ["TIN", "Tin học"],
    ["TD", "Thể dục"],
    ["NT", "Nghệ thuật (Mỹ thuật/Âm nhạc)"],
    ["KHTN", "Khoa học tự nhiên"],
    ["NGUVAN", "Ngữ văn"],
  ];
  for (const [maMon, tenMon] of mons) {
    await db.monHoc.upsert({
      where: { maMon },
      update: {},
      create: { maMon, tenMon },
    });
  }

  // ---- Tổ chuyên môn ----
  const toTieuHoc = await db.toChuyenMon.upsert({
    where: { ten: "Tổ Tiểu học" },
    update: {},
    create: { ten: "Tổ Tiểu học", moTa: "Giáo viên khối tiểu học" },
  });
  const toToan = await db.toChuyenMon.upsert({
    where: { ten: "Tổ Toán - Tin" },
    update: {},
    create: { ten: "Tổ Toán - Tin", moTa: "Bộ môn Toán, Tin học" },
  });
  const toVan = await db.toChuyenMon.upsert({
    where: { ten: "Tổ Ngữ văn - Tiếng Anh" },
    update: {},
    create: { ten: "Tổ Ngữ văn - Tiếng Anh", moTa: "Bộ môn Văn, tiếng Anh" },
  });

  // ---- Giáo viên + tài khoản ----
  async function taoGiaoVien(
    maGV,
    hoTen,
    gioiTinh,
    chuyenMon,
    toId,
    vaiTro,
    email
  ) {
    let user = null;
    if (email) {
      user = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          matKhau: await bcrypt.hash("gv123456", 10),
          hoTen,
          vaiTro,
        },
      });
    }
    const existed = await db.giaoVien.findUnique({ where: { maGV } });
    if (existed) return existed;
    return db.giaoVien.create({
      data: {
        maGV,
        hoTen,
        gioiTinh,
        chuyenMon,
        trinhDo: "Đại học",
        toChuyenMonId: toId,
        userId: user?.id ?? null,
      },
    });
  }

  const gv1 = await taoGiaoVien(
    "GV001",
    "Nguyễn Thị Lan",
    false,
    "Giáo viên tiểu học",
    toTieuHoc.id,
    "TO_TRUONG",
    "lan.nt@truonghoc.edu.vn"
  );
  const gv2 = await taoGiaoVien(
    "GV002",
    "Trần Văn Bình",
    true,
    "Toán",
    toToan.id,
    "TO_TRUONG",
    "binh.tv@truonghoc.edu.vn"
  );
  const gv3 = await taoGiaoVien(
    "GV003",
    "Phạm Minh Tuấn",
    true,
    "Ngữ văn",
    toVan.id,
    "GIAO_VIEN",
    "tuan.pm@truonghoc.edu.vn"
  );
  const gv4 = await taoGiaoVien(
    "GV004",
    "Lê Thu Hà",
    false,
    "Tiếng Việt / Tiểu học",
    toTieuHoc.id,
    "GIAO_VIEN",
    null
  );
  void gv4;

  // ---- Tài khoản Ban Giám đốc ----
  const bgd = await db.user.upsert({
    where: { email: "bgd@truonghoc.edu.vn" },
    update: { vaiTro: "BAN_GIAM_DOC" },
    create: {
      email: "bgd@truonghoc.edu.vn",
      matKhau: await bcrypt.hash("bgd123456", 10),
      hoTen: "Trần Quốc Đoàn",
      vaiTro: "BAN_GIAM_DOC",
    },
  });

  await db.toChuyenMon.update({ where: { id: toTieuHoc.id }, data: { toTruongId: gv1.id } });
  await db.toChuyenMon.update({ where: { id: toToan.id }, data: { toTruongId: gv2.id } });
  await db.toChuyenMon.update({ where: { id: toVan.id }, data: { toTruongId: gv3.id } });
  void admin;

  // ---- Lớp học ----
  async function taoLop(ten, khoi, gvcnId) {
    const existed = await db.lopHoc.findFirst({
      where: { ten, namHocId: namHoc.id },
    });
    if (existed) return existed;
    return db.lopHoc.create({
      data: { ten, khoi, gvcnId, namHocId: namHoc.id },
    });
  }

  const lop1A = await taoLop("1A", 1, gv1.id);
  const lop2A = await taoLop("2A", 2, gv4.id);
  const lop6A = await taoLop("6A", 6, gv2.id);
  const lop9A = await taoLop("9A", 9, gv3.id);

  // ---- Học sinh ----
  const dsHS = [
    ["HS001", "Nguyễn Văn An", true, lop1A.id],
    ["HS002", "Trần Thị Bích", false, lop1A.id],
    ["HS003", "Lê Quốc Cường", true, lop1A.id],
    ["HS004", "Phạm Thị Dung", false, lop2A.id],
    ["HS005", "Hoàng Văn Em", true, lop2A.id],
    ["HS006", "Đỗ Thị Giang", false, lop6A.id],
    ["HS007", "Bùi Văn Hải", true, lop6A.id],
    ["HS008", "Vũ Thị Hoa", false, lop9A.id],
    ["HS009", "Đặng Văn Inh", true, lop9A.id],
  ];
  for (const [maHS, hoTen, gioiTinh, lopHocId] of dsHS) {
    const existed = await db.hocSinh.findUnique({ where: { maHS } });
    if (!existed) {
      await db.hocSinh.create({
        data: {
          maHS,
          hoTen,
          gioiTinh,
          ngaySinh: new Date(2015 + Math.floor(Math.random() * 6), 5, 15),
          diaChi: "Khóm 1, phường Trung Tâm",
          sdtPhuHuynh: "09xxxxxxxx",
          lopHocId,
        },
      });
    }
  }

  // ---- Giáo án demo với chữ ký đủ 3 cấp ----
  async function chuKy(giaoAnId, capKy, nguoiKyId, tenNguoiKy, chucVu, phutTruoc) {
    return db.chuKy.create({
      data: {
        loaiVanBan: "GIAO_AN",
        vanBanId: giaoAnId,
        capKy,
        nguoiKyId,
        tenNguoiKy,
        chucVu,
        maXacThuc: Math.random().toString(16).slice(2, 10).toUpperCase(),
        kyLuc: new Date(Date.now() - phutTruoc * 60000),
      },
    });
  }

  const coGiaoAnDemo = await db.giaoAn.findFirst({
    where: { tieuDe: { contains: "Cánh én" } },
  });
  if (!coGiaoAnDemo && gv1 && lop1A) {
    const monTV = await db.monHoc.findUnique({ where: { maMon: "TV" } });
    const giaoAnDemo = await db.giaoAn.create({
      data: {
        loai: "GIAO_AN",
        tieuDe: "Bài 1: Cánh én thông báo mùa xuân (demo ký duyệt)",
        noiDung:
          "I. MỤC TIÊU\n1. Kiến thức: Đọc hiểu văn bản miêu tả, cảnh vật mùa xuân.\n2. Kỹ năng: Đọc thành tiếng, trao đổi về nội dung bài đọc.\n\nII. ĐỒ DÙNG DẠY HỌC\n- Tranh ảnh minh họa, bảng phụ.\n\nIII. CÁC HOẠT ĐỘNG DẠY HỌC\n1. Khởi động (5 phút)\n2. Khám phá (25 phút)\n3. Luyện tập (8 phút)\n4. Vận dụng (2 phút)",
        giaoVienId: gv1.id,
        monHocId: monTV.id,
        lopHocId: lop1A.id,
        trangThai: "DA_DUYET",
        ngayGui: new Date(Date.now() - 180 * 60000),
      },
    });
    await chuKy(giaoAnDemo.id, "GV_SOAN", gv1.user?.id ?? admin.id, gv1.hoTen, "Giáo viên", 180);
    await chuKy(giaoAnDemo.id, "TO_TRUONG", gv2.user?.id ?? admin.id, gv2.hoTen, "Tổ trưởng chuyên môn", 120);
    await chuKy(giaoAnDemo.id, "BAN_GIAM_DOC", bgd.id, bgd.hoTen, "Giám đốc", 60);
    console.log("   Đã tạo giáo án demo đã ký đủ 3 cấp.");
  }
  void toVan;

  console.log("✅ Hoàn tất dữ liệu mẫu!");
  console.log("   Admin: admin@truonghoc.edu.vn / admin123");
  console.log("   Ban Giám đốc: bgd@truonghoc.edu.vn / bgd123456");
  console.log("   Giáo viên có tài khoản: lan.nt@ / binh.tv@ / tuan.pm@truonghoc.edu.vn / gv123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
