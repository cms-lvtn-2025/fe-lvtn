import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Users, FileText, Calendar, CheckCircle } from "lucide-react"

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tổng quan</h1>
          <p className="text-muted-foreground">Quản lý sinh viên và luận văn hướng dẫn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-2xl font-bold mb-1">0</p>
            <p className="text-sm text-muted-foreground">Sinh viên hướng dẫn</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-accent" />
            </div>
            <p className="text-2xl font-bold mb-1">0</p>
            <p className="text-sm text-muted-foreground">Luận văn</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mb-1">0</p>
            <p className="text-sm text-muted-foreground">Lịch hẹn</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold mb-1">0</p>
            <p className="text-sm text-muted-foreground">Đã đánh giá</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">Chưa có hoạt động nào</p>
                <p className="text-sm text-muted-foreground">Hoạt động của sinh viên sẽ hiển thị tại đây</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
