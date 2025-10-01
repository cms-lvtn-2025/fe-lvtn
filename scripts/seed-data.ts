import { config } from "dotenv"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Load environment variables
config()

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()

// Helper function to create document with ID
async function createDoc(collection: string, id: string, data: any) {
  await db.collection(collection).doc(id).set(data)
  console.log(`✓ Created ${collection}/${id}`)
  return id
}

async function seedData() {
  console.log("🌱 Starting data seeding...\n")

  // ============= 1. CREATE SEMESTERS (Tenant Root) =============
  console.log("📅 Creating Semesters...")
  const semester1 = await createDoc("semesters", "sem-2024-1", {
    title: "Học kỳ 1 năm 2024-2025",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const semester2 = await createDoc("semesters", "sem-2024-2", {
    title: "Học kỳ 2 năm 2024-2025",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 2. CREATE FACULTIES =============
  console.log("🏛️  Creating Faculties...")
  const facultyCSE = await createDoc("faculties", "fac-cse", {
    title: "Khoa Khoa học và Kỹ thuật Máy tính",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const facultyEE = await createDoc("faculties", "fac-ee", {
    title: "Khoa Điện - Điện tử",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 3. CREATE MAJORS =============
  console.log("🎓 Creating Majors...")
  const majorCS = await createDoc("majors", "maj-cs", {
    title: "Khoa học Máy tính",
    faculty_code: facultyCSE,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const majorSE = await createDoc("majors", "maj-se", {
    title: "Kỹ thuật Phần mềm",
    faculty_code: facultyCSE,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const majorEE = await createDoc("majors", "maj-ee", {
    title: "Kỹ thuật Điện tử",
    faculty_code: facultyEE,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 4. CREATE TEACHERS (với semester_code) =============
  console.log("👨‍🏫 Creating Teachers...")
  const teacher1 = await createDoc("teachers", "teacher-001", {
    email: "lyvinhthai321@gmail.com",
    username: "nguyenvana",
    gender: "male",
    major_code: majorCS,
    semester_code: semester1, // Teacher thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher2 = await createDoc("teachers", "teacher-002", {
    email: "tranthib@hcmut.edu.vn",
    username: "tranthib",
    gender: "female",
    major_code: majorSE,
    semester_code: semester1, // Teacher thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher3 = await createDoc("teachers", "teacher-003", {
    email: "levanc@hcmut.edu.vn",
    username: "levanc",
    gender: "male",
    major_code: majorEE,
    semester_code: semester1, // Teacher thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher4 = await createDoc("teachers", "teacher-004", {
    email: "phamthid@hcmut.edu.vn",
    username: "phamthid",
    gender: "female",
    major_code: majorCS,
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher5 = await createDoc("teachers", "teacher-005", {
    email: "hoangvane@hcmut.edu.vn",
    username: "hoangvane",
    gender: "male",
    major_code: majorSE,
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher6 = await createDoc("teachers", "teacher-006", {
    email: "vuthif@hcmut.edu.vn",
    username: "vuthif",
    gender: "female",
    major_code: majorCS,
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  // Teachers cho semester 2
  const teacher7 = await createDoc("teachers", "teacher-007", {
    email: "tranthig@hcmut.edu.vn",
    username: "tranthig",
    gender: "female",
    major_code: majorCS,
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const teacher8 = await createDoc("teachers", "teacher-008", {
    email: "nguyenvanh@hcmut.edu.vn",
    username: "nguyenvanh",
    gender: "male",
    major_code: majorSE,
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 5. CREATE ROLE SYSTEMS (theo semester) =============
  console.log("🔐 Creating Role Systems...")

  // Semester 1 roles
  await createDoc("rolesystems", "role-sem1-gv", {
    title: "Giáo vụ Khoa - HK1 2024-2025",
    teacher_code: teacher1,
    role: "Academic_affairs_staff",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-supervisor1", {
    title: "GVHD - HK1 2024-2025",
    teacher_code: teacher1,
    role: "Supervisor_lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-supervisor2", {
    title: "GVHD - HK1 2024-2025",
    teacher_code: teacher2,
    role: "Supervisor_lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-reviewer", {
    title: "GVPB - HK1 2024-2025",
    teacher_code: teacher3,
    role: "Reviewer_Lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-supervisor3", {
    title: "GVHD - HK1 2024-2025",
    teacher_code: teacher4,
    role: "Supervisor_lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-supervisor4", {
    title: "GVHD - HK1 2024-2025",
    teacher_code: teacher5,
    role: "Supervisor_lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem1-reviewer2", {
    title: "GVPB - HK1 2024-2025",
    teacher_code: teacher6,
    role: "Reviewer_Lecturer",
    semester_code: semester1,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  // Semester 2 roles
  await createDoc("rolesystems", "role-sem2-gv", {
    title: "Giáo vụ Khoa - HK2 2024-2025",
    teacher_code: teacher7,
    role: "Academic_affairs_staff",
    semester_code: semester2,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem2-supervisor1", {
    title: "GVHD - HK2 2024-2025",
    teacher_code: teacher7,
    role: "Supervisor_lecturer",
    semester_code: semester2,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  await createDoc("rolesystems", "role-sem2-supervisor2", {
    title: "GVHD - HK2 2024-2025",
    teacher_code: teacher8,
    role: "Supervisor_lecturer",
    semester_code: semester2,
    activate: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 6. CREATE STUDENTS (với semester_code) =============
  console.log("👨‍🎓 Creating Students...")
  const student1 = await createDoc("students", "student-2011001", {
    email: "lyvinhthai321@gmail.com",
    phone: "0911234567",
    username: "phamvand",
    gender: "male",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester1, // Student thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student2 = await createDoc("students", "student-2011002", {
    email: "hoangthie.sdh24@hcmut.edu.vn",
    phone: "0912345678",
    username: "hoangthie",
    gender: "female",
    major_code: majorSE,
    class_code: "CC02",
    semester_code: semester1, // Student thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student3 = await createDoc("students", "student-2011003", {
    email: "vuthif.sdh24@hcmut.edu.vn",
    phone: "0913456789",
    username: "vuthif",
    gender: "female",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester1, // Student thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student4 = await createDoc("students", "student-2011004", {
    email: "dangvang.sdh24@hcmut.edu.vn",
    phone: "0914567890",
    username: "dangvang",
    gender: "male",
    major_code: majorEE,
    class_code: "EE01",
    semester_code: semester1, // Student thuộc semester 1
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student5 = await createDoc("students", "student-2011005", {
    email: "buithih.sdh24@hcmut.edu.vn",
    phone: "0915678901",
    username: "buithih",
    gender: "female",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student6 = await createDoc("students", "student-2011006", {
    email: "doanvani.sdh24@hcmut.edu.vn",
    phone: "0916789012",
    username: "doanvani",
    gender: "male",
    major_code: majorSE,
    class_code: "CC02",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student7 = await createDoc("students", "student-2011007", {
    email: "lethij.sdh24@hcmut.edu.vn",
    phone: "0917890123",
    username: "lethij",
    gender: "female",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student8 = await createDoc("students", "student-2011008", {
    email: "ngothik.sdh24@hcmut.edu.vn",
    phone: "0918901234",
    username: "ngothik",
    gender: "female",
    major_code: majorSE,
    class_code: "CC02",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student9 = await createDoc("students", "student-2011009", {
    email: "tranvanl.sdh24@hcmut.edu.vn",
    phone: "0919012345",
    username: "tranvanl",
    gender: "male",
    major_code: majorEE,
    class_code: "EE01",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student10 = await createDoc("students", "student-2011010", {
    email: "phamthim.sdh24@hcmut.edu.vn",
    phone: "0920123456",
    username: "phamthim",
    gender: "female",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  // Students cho semester 2
  const student11 = await createDoc("students", "student-2012001", {
    email: "nguyenvane.sdh25@hcmut.edu.vn",
    phone: "0921234567",
    username: "nguyenvane",
    gender: "male",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student12 = await createDoc("students", "student-2012002", {
    email: "lethio.sdh25@hcmut.edu.vn",
    phone: "0922345678",
    username: "lethio",
    gender: "female",
    major_code: majorSE,
    class_code: "CC02",
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student13 = await createDoc("students", "student-2012003", {
    email: "tranvanp.sdh25@hcmut.edu.vn",
    phone: "0923456789",
    username: "tranvanp",
    gender: "male",
    major_code: majorCS,
    class_code: "CC01",
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student14 = await createDoc("students", "student-2012004", {
    email: "hoangthiq.sdh25@hcmut.edu.vn",
    phone: "0924567890",
    username: "hoangthiq",
    gender: "female",
    major_code: majorSE,
    class_code: "CC02",
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })

  const student15 = await createDoc("students", "student-2012005", {
    email: "vuvanr.sdh25@hcmut.edu.vn",
    phone: "0925678901",
    username: "vuvanr",
    gender: "male",
    major_code: majorEE,
    class_code: "EE01",
    semester_code: semester2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
  })
  console.log("")

  // ============= 7. CREATE FILES =============
  console.log("📄 Creating Files...")
  const file1 = await createDoc("files", "file-001", {
    title: "Đề cương - Nhận diện khuôn mặt",
    file: "https://storage.example.com/assignments/topic-001-assignment.pdf",
    status: "approved",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher1,
    updated_by: teacher1,
  })

  const file2 = await createDoc("files", "file-002", {
    title: "Đề cương - Quản lý thư viện",
    file: "https://storage.example.com/assignments/topic-002-assignment.pdf",
    status: "approved",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher2,
    updated_by: teacher2,
  })

  const file3 = await createDoc("files", "file-003", {
    title: "Báo cáo giữa kỳ - Student 1",
    file: "https://storage.example.com/midterms/midterm-001-report.pdf",
    status: "submitted",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student1,
    updated_by: student1,
  })

  const file4 = await createDoc("files", "file-004", {
    title: "Báo cáo cuối kỳ - Student 1",
    file: "https://storage.example.com/finals/final-001-report.pdf",
    status: "submitted",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student1,
    updated_by: student1,
  })
  console.log("")

  // ============= 8. CREATE MIDTERMS =============
  console.log("📝 Creating Midterms...")
  const midterm1 = await createDoc("midterms", "midterm-001", {
    title: "Báo cáo giữa kỳ - Nhận diện khuôn mặt",
    grade: 85,
    status: "graded",
    feedback: "Tiến độ tốt, cần hoàn thiện phần thực nghiệm",
    file_submit: file3,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student1,
    updated_by: teacher1,
  })

  const midterm2 = await createDoc("midterms", "midterm-002", {
    title: "Báo cáo giữa kỳ - Quản lý thư viện",
    grade: 90,
    status: "graded",
    feedback: "Rất tốt, tiếp tục phát triển",
    file_submit: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student2,
    updated_by: teacher2,
  })
  console.log("")

  // ============= 9. CREATE FINALS =============
  console.log("🎯 Creating Finals...")
  const final1 = await createDoc("finals", "final-001", {
    title: "Báo cáo cuối kỳ - Nhận diện khuôn mặt",
    file_code: file4,
    supervisor_grade: 85,
    reviewer_grade: 80,
    defense_grade: 82,
    final_grade: 83,
    status: "completed",
    notes: "Hoàn thành tốt đề tài",
    completion_date: new Date("2025-01-15"),
  })

  const final2 = await createDoc("finals", "final-002", {
    title: "Báo cáo cuối kỳ - Quản lý thư viện",
    file_code: null,
    supervisor_grade: null,
    reviewer_grade: null,
    defense_grade: null,
    final_grade: null,
    status: "in_progress",
    notes: null,
    completion_date: null,
  })
  console.log("")

  // ============= 10. CREATE TOPICS (gắn với semester) =============
  console.log("📚 Creating Topics...")
  const topic1 = await createDoc("topics", "topic-001", {
    title: "Xây dựng hệ thống nhận diện khuôn mặt sử dụng Deep Learning",
    major_code: majorCS,
    assignment_code: file1,
    enrollment_code: null, // Sẽ update sau khi có enrollment
    semester_code: semester1, // Topic thuộc semester 1
    teacher_supervisor_code: teacher1,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher1,
    updated_by: teacher1,
  })

  const topic2 = await createDoc("topics", "topic-002", {
    title: "Phát triển ứng dụng quản lý thư viện sử dụng Microservices",
    major_code: majorSE,
    assignment_code: file2,
    enrollment_code: null,
    semester_code: semester1, // Topic thuộc semester 1
    teacher_supervisor_code: teacher2,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher2,
    updated_by: teacher2,
  })

  const topic3 = await createDoc("topics", "topic-003", {
    title: "Thiết kế hệ thống IoT giám sát môi trường",
    major_code: majorEE,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1, // Topic thuộc semester 1
    teacher_supervisor_code: teacher3,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher3,
    updated_by: teacher3,
  })

  const topic4 = await createDoc("topics", "topic-004", {
    title: "Phát triển chatbot hỗ trợ tư vấn tuyển sinh",
    major_code: majorCS,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1,
    teacher_supervisor_code: teacher4,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher4,
    updated_by: teacher4,
  })

  const topic5 = await createDoc("topics", "topic-005", {
    title: "Xây dựng hệ thống CI/CD cho ứng dụng web",
    major_code: majorSE,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1,
    teacher_supervisor_code: teacher5,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher5,
    updated_by: teacher5,
  })

  const topic6 = await createDoc("topics", "topic-006", {
    title: "Ứng dụng computer vision trong phát hiện lỗi sản phẩm",
    major_code: majorCS,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1,
    teacher_supervisor_code: teacher1,
    status: "approved",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher1,
    updated_by: teacher1,
  })

  const topic7 = await createDoc("topics", "topic-007", {
    title: "Phân tích dữ liệu lớn với Apache Spark",
    major_code: majorCS,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1,
    teacher_supervisor_code: teacher4,
    status: "pending",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher4,
    updated_by: teacher4,
  })

  const topic8 = await createDoc("topics", "topic-008", {
    title: "Xây dựng app mobile quản lý sức khỏe",
    major_code: majorSE,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester1,
    teacher_supervisor_code: teacher5,
    status: "pending",
    time_start: new Date("2024-09-01"),
    time_end: new Date("2025-01-15"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher5,
    updated_by: teacher5,
  })

  // Topics cho semester 2
  const topic9 = await createDoc("topics", "topic-009", {
    title: "Ứng dụng Blockchain trong quản lý chuỗi cung ứng",
    major_code: majorCS,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester2,
    teacher_supervisor_code: teacher7,
    status: "pending",
    time_start: new Date("2025-02-01"),
    time_end: new Date("2025-06-30"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher7,
    updated_by: teacher7,
  })

  const topic10 = await createDoc("topics", "topic-010", {
    title: "Hệ thống recommendation sử dụng collaborative filtering",
    major_code: majorCS,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester2,
    teacher_supervisor_code: teacher7,
    status: "approved",
    time_start: new Date("2025-02-01"),
    time_end: new Date("2025-06-30"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher7,
    updated_by: teacher7,
  })

  const topic11 = await createDoc("topics", "topic-011", {
    title: "Phát triển game 2D sử dụng Unity",
    major_code: majorSE,
    assignment_code: null,
    enrollment_code: null,
    semester_code: semester2,
    teacher_supervisor_code: teacher8,
    status: "approved",
    time_start: new Date("2025-02-01"),
    time_end: new Date("2025-06-30"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher8,
    updated_by: teacher8,
  })
  console.log("")

  // ============= 11. CREATE ENROLLMENTS =============
  console.log("📋 Creating Enrollments...")
  const enrollment1 = await createDoc("enrollments", "enroll-001", {
    title: "Đăng ký đề tài - Nhận diện khuôn mặt",
    student_code: student1,
    midterm_code: midterm1,
    final_code: final1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student1,
    updated_by: student1,
  })

  const enrollment2 = await createDoc("enrollments", "enroll-002", {
    title: "Đăng ký đề tài - Quản lý thư viện",
    student_code: student2,
    midterm_code: midterm2,
    final_code: final2,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student2,
    updated_by: student2,
  })

  const enrollment3 = await createDoc("enrollments", "enroll-003", {
    title: "Đăng ký đề tài - IoT",
    student_code: student4,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student4,
    updated_by: student4,
  })

  const enrollment4 = await createDoc("enrollments", "enroll-004", {
    title: "Đăng ký đề tài - Chatbot",
    student_code: student5,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student5,
    updated_by: student5,
  })

  const enrollment5 = await createDoc("enrollments", "enroll-005", {
    title: "Đăng ký đề tài - CI/CD",
    student_code: student6,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student6,
    updated_by: student6,
  })

  const enrollment6 = await createDoc("enrollments", "enroll-006", {
    title: "Đăng ký đề tài - Computer Vision",
    student_code: student7,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student7,
    updated_by: student7,
  })

  // Enrollments for semester 2
  const enrollment7 = await createDoc("enrollments", "enroll-007", {
    title: "Đăng ký đề tài - Recommendation System",
    student_code: student11,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student11,
    updated_by: student11,
  })

  const enrollment8 = await createDoc("enrollments", "enroll-008", {
    title: "Đăng ký đề tài - Game 2D",
    student_code: student12,
    midterm_code: null,
    final_code: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: student12,
    updated_by: student12,
  })
  console.log("")

  // Update topics with enrollment_code
  console.log("🔄 Updating Topics with Enrollments...")
  await db.collection("topics").doc(topic1).update({ enrollment_code: enrollment1 })
  await db.collection("topics").doc(topic2).update({ enrollment_code: enrollment2 })
  await db.collection("topics").doc(topic3).update({ enrollment_code: enrollment3 })
  await db.collection("topics").doc(topic4).update({ enrollment_code: enrollment4 })
  await db.collection("topics").doc(topic5).update({ enrollment_code: enrollment5 })
  await db.collection("topics").doc(topic6).update({ enrollment_code: enrollment6 })
  await db.collection("topics").doc(topic10).update({ enrollment_code: enrollment7 })
  await db.collection("topics").doc(topic11).update({ enrollment_code: enrollment8 })
  console.log("✓ Updated 8 topics")
  console.log("")

  // ============= 12. CREATE COUNCILS =============
  console.log("🏛️  Creating Councils...")
  const council1 = await createDoc("councils", "council-001", {
    title: "Hội đồng bảo vệ 1 - Khoa học Máy tính",
    major_code: majorCS,
    topic_code: topic1,
    time_start: new Date("2025-01-10T09:00:00"),
    time_end: new Date("2025-01-10T11:00:00"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher1,
    updated_by: teacher1,
  })

  const council2 = await createDoc("councils", "council-002", {
    title: "Hội đồng bảo vệ 2 - Kỹ thuật Phần mềm",
    major_code: majorSE,
    topic_code: topic2,
    time_start: new Date("2025-01-11T14:00:00"),
    time_end: new Date("2025-01-11T16:00:00"),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: teacher2,
    updated_by: teacher2,
  })
  console.log("")

  // ============= 13. CREATE DEFENCES =============
  console.log("🎤 Creating Defences...")
  await createDoc("defences", "defence-001", {
    title: "Chủ tịch hội đồng 1",
    council_code: council1,
    teacher_code: teacher2,
    position: "chairman",
  })

  await createDoc("defences", "defence-002", {
    title: "Thư ký hội đồng 1",
    council_code: council1,
    teacher_code: teacher1,
    position: "secretary",
  })

  await createDoc("defences", "defence-003", {
    title: "Phản biện hội đồng 1",
    council_code: council1,
    teacher_code: teacher3,
    position: "reviewer",
  })

  await createDoc("defences", "defence-004", {
    title: "Chủ tịch hội đồng 2",
    council_code: council2,
    teacher_code: teacher1,
    position: "chairman",
  })
  console.log("")

  console.log("✅ Data seeding completed successfully!\n")
  console.log("📊 Summary:")
  console.log("  • 2 Semesters (tenant isolation)")
  console.log("  • 2 Faculties")
  console.log("  • 3 Majors")
  console.log("  • 8 Teachers (6 in sem1, 2 in sem2)")
  console.log("  • 10 Role Systems (7 in sem1, 3 in sem2)")
  console.log("  • 15 Students (10 in sem1, 5 in sem2)")
  console.log("  • 11 Topics (8 in sem1, 3 in sem2)")
  console.log("  • 8 Enrollments (6 in sem1, 2 in sem2)")
  console.log("  • 2 Councils")
  console.log("  • 4 Defences")
  console.log("  • 2 Midterms")
  console.log("  • 2 Finals")
  console.log("  • 4 Files")
  console.log("\n💡 Note: All data is scoped by semester_code for tenant isolation")
  console.log("💡 Semester 1: 10 students, 6 teachers, 8 topics (6 enrolled)")
  console.log("💡 Semester 2: 5 students, 2 teachers, 3 topics (2 enrolled)")
}

// Run the seed function
seedData()
  .then(() => {
    console.log("\n✨ Seeding process finished successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error seeding data:", error)
    process.exit(1)
  })
