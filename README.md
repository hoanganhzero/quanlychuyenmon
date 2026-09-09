# Quản lý chuyên môn

Hệ thống quản lý chuyên môn dành cho Trung tâm GDNN–GDTX Khu vực 1, triển khai trên ChatGPT Sites.

## Chức năng

- Quản lý năm học, tổ chuyên môn, giáo viên, môn học và lớp học.
- Tải hồ sơ Word/PDF lên kho R2, trình duyệt và phê duyệt.
- Thông báo nội bộ và phân quyền tài khoản.
- Đăng nhập bằng tài khoản ChatGPT; người dùng đầu tiên là quản trị viên.
- Dữ liệu có cấu trúc được lưu bền vững trong D1.

## Phát triển

- `npm run build`: tạo bản dựng Sites.
- `npm run db:generate`: tạo migration sau khi thay đổi `db/schema.ts`.
