# Hướng dẫn Seed Data cho Firebase

## Yêu cầu

Trước khi chạy script seed data, bạn cần:

1. **Firebase Project đã được tạo** trên [Firebase Console](https://console.firebase.google.com/)
2. **Firestore Database đã được kích hoạt** (chọn chế độ test hoặc production)
3. **Service Account Key** từ Firebase Admin SDK

## Bước 1: Lấy Service Account Key

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** (biểu tượng bánh răng) > **Service accounts**
4. Click **Generate new private key**
5. Lưu file JSON được tải về

## Bước 2: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root của project với nội dung:

\`\`\`env
# Firebase Client Config (đã có)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (cần thêm)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
\`\`\`

**Lưu ý:** 
- `FIREBASE_CLIENT_EMAIL` và `FIREBASE_PRIVATE_KEY` lấy từ file JSON đã tải ở Bước 1
- Private key phải giữ nguyên format với `\n` cho line breaks
- Đặt private key trong dấu ngoặc kép

## Bước 3: Cài đặt Dependencies

\`\`\`bash
npm install
\`\`\`

## Bước 4: Chạy Seed Script

\`\`\`bash
npm run seed
\`\`\`

## Kết quả

Script sẽ tạo data mẫu cho:

- ✅ 2 Học kỳ (Semesters)
- ✅ 2 Khoa (Faculties)
- ✅ 3 Ngành (Majors)
- ✅ 3 Vai trò hệ thống (Role Systems)
- ✅ 3 Giảng viên (Teachers)
- ✅ 4 Sinh viên (Students)
- ✅ 4 Đề tài (Topics)
- ✅ 3 Đăng ký (Enrollments)
- ✅ 2 Hội đồng (Councils)
- ✅ 3 Buổi bảo vệ (Defences)
- ✅ 2 Điểm giữa kỳ (Midterms)
- ✅ 2 File (Files)

## Tài khoản Test

### Giảng viên:
- Email: `nguyenvana@hcmut.edu.vn`
- Email: `tranthib@hcmut.edu.vn`
- Email: `levanc@hcmut.edu.vn`

### Sinh viên:
- Email: `phamvand@hcmut.edu.vn` (MSSV: 2011001)
- Email: `hoangthie@hcmut.edu.vn` (MSSV: 2011002)
- Email: `vuthif@hcmut.edu.vn` (MSSV: 2011003)
- Email: `dangvang@hcmut.edu.vn` (MSSV: 2011004)

**Lưu ý:** Bạn cần tạo các tài khoản này trong Firebase Authentication trước khi đăng nhập, hoặc sử dụng Google Sign-In.

## Xử lý lỗi

### Lỗi: "Permission denied"
- Kiểm tra Firestore Rules trong Firebase Console
- Đảm bảo rules cho phép write từ Admin SDK

### Lỗi: "Invalid credentials"
- Kiểm tra lại FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY
- Đảm bảo private key có đúng format với `\n`

### Lỗi: "Document already exists"
- Script sẽ ghi đè lên documents có cùng ID
- Nếu muốn xóa hết data cũ, vào Firestore Console và xóa collections

## Chạy lại Script

Bạn có thể chạy lại script bất cứ lúc nào:

\`\`\`bash
npm run seed
\`\`\`

Script sẽ ghi đè lên data cũ với cùng ID.
