import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Hệ thống Quản lý Luận văn</h1>
              <p className="text-xs text-muted-foreground">Đại học Bách Khoa TP.HCM</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 text-balance">Quản lý Luận văn Tốt nghiệp</h2>
          <p className="text-xl text-muted-foreground mb-12 text-pretty leading-relaxed">
            Hệ thống quản lý toàn diện cho quy trình luận văn tốt nghiệp, từ đăng ký đề tài đến bảo vệ và đánh giá.
          </p>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/login/student">
              <div className="group p-8 rounded-lg border border-border bg-card hover:bg-secondary transition-colors cursor-pointer h-full">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Sinh viên</h3>
                  <p className="text-muted-foreground text-sm">
                    Đăng ký đề tài, nộp báo cáo và theo dõi tiến độ luận văn
                  </p>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  Đăng nhập
                </Button>
              </div>
            </Link>

            <Link href="/login/teacher">
              <div className="group p-8 rounded-lg border border-border bg-card hover:bg-secondary transition-colors cursor-pointer h-full">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Giáo viên</h3>
                  <p className="text-muted-foreground text-sm">Hướng dẫn, phản biện và đánh giá luận văn sinh viên</p>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  Đăng nhập
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Đại học Bách Khoa TP.HCM. Hệ thống Quản lý Luận văn Tốt nghiệp.</p>
        </div>
      </footer>
    </div>
  )
}
