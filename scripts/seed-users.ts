import { config } from "dotenv"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

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

const auth = getAuth()

async function createUser(email: string, password: string, displayName: string, uid: string) {
  try {
    const user = await auth.createUser({
      uid,
      email,
      password,
      displayName,
      emailVerified: true,
    })
    console.log(`✓ Created user: ${email}`)
    return user
  } catch (error: any) {
    if (error.code === "auth/uid-already-exists") {
      console.log(`⚠ User ${email} already exists, skipping...`)
    } else {
      console.error(`✗ Error creating user ${email}:`, error.message)
    }
  }
}

async function seedUsers() {
  console.log("🔐 Starting user seeding...\n")

  // ============= CREATE TEACHERS =============
  console.log("👨‍🏫 Creating Teacher Users...")
  await createUser("lyvinhthai321@gmail.com", "teacher123", "TS. Nguyễn Văn A", "teacher-001")
  await createUser("tranthib@hcmut.edu.vn", "teacher123", "PGS.TS. Trần Thị B", "teacher-002")
  await createUser("levanc@hcmut.edu.vn", "teacher123", "TS. Lê Văn C", "teacher-003")
  await createUser("phamthid@hcmut.edu.vn", "teacher123", "TS. Phạm Thị D", "teacher-004")
  await createUser("hoangvane@hcmut.edu.vn", "teacher123", "TS. Hoàng Văn E", "teacher-005")
  await createUser("vuthif@hcmut.edu.vn", "teacher123", "TS. Vũ Thị F", "teacher-006")
  await createUser("tranthig@hcmut.edu.vn", "teacher123", "TS. Trần Thị G", "teacher-007")
  await createUser("nguyenvanh@hcmut.edu.vn", "teacher123", "TS. Nguyễn Văn H", "teacher-008")
  console.log("")

  // ============= CREATE STUDENTS =============
  console.log("👨‍🎓 Creating Student Users...")

  // Semester 1 students
  await createUser("lyvinhthai3210@gmail.com", "student123", "Phạm Văn D", "student-2011001")
  await createUser("hoangthie.sdh24@hcmut.edu.vn", "student123", "Hoàng Thị E", "student-2011002")
  await createUser("vuthif.sdh24@hcmut.edu.vn", "student123", "Vũ Thị F", "student-2011003")
  await createUser("dangvang.sdh24@hcmut.edu.vn", "student123", "Đặng Văn G", "student-2011004")
  await createUser("buithih.sdh24@hcmut.edu.vn", "student123", "Bùi Thị H", "student-2011005")
  await createUser("doanvani.sdh24@hcmut.edu.vn", "student123", "Đoàn Văn I", "student-2011006")
  await createUser("lethij.sdh24@hcmut.edu.vn", "student123", "Lê Thị J", "student-2011007")
  await createUser("ngothik.sdh24@hcmut.edu.vn", "student123", "Ngô Thị K", "student-2011008")
  await createUser("tranvanl.sdh24@hcmut.edu.vn", "student123", "Trần Văn L", "student-2011009")
  await createUser("phamthim.sdh24@hcmut.edu.vn", "student123", "Phạm Thị M", "student-2011010")

  // Semester 2 students
  await createUser("nguyenvane.sdh25@hcmut.edu.vn", "student123", "Nguyễn Văn E", "student-2012001")
  await createUser("lethio.sdh25@hcmut.edu.vn", "student123", "Lê Thị O", "student-2012002")
  await createUser("tranvanp.sdh25@hcmut.edu.vn", "student123", "Trần Văn P", "student-2012003")
  await createUser("hoangthiq.sdh25@hcmut.edu.vn", "student123", "Hoàng Thị Q", "student-2012004")
  await createUser("vuvanr.sdh25@hcmut.edu.vn", "student123", "Vũ Văn R", "student-2012005")
  console.log("")

  // ============= CREATE ADMIN =============
  console.log("👑 Creating Admin User...")
  await createUser("admin@hcmut.edu.vn", "admin123", "Administrator", "admin-001")
  console.log("")

  console.log("✅ User seeding completed successfully!\n")
  console.log("📊 Summary:")
  console.log("  • 8 Teachers")
  console.log("  • 15 Students")
  console.log("  • 1 Admin")
  console.log("\n🔑 Login credentials:")
  console.log("  Teachers: email@hcmut.edu.vn / password: teacher123")
  console.log("  Students: email.sdh24@hcmut.edu.vn / password: student123")
  console.log("  Admin: admin@hcmut.edu.vn / password: admin123")
}

// Run the seed function
seedUsers()
  .then(() => {
    console.log("\n✨ User seeding process finished!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error seeding users:", error)
    process.exit(1)
  })
