import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StudentInfoCardProps {
  username: string
  studentId: string
  email: string
}

export function StudentInfoCard({ username, studentId, email }: StudentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin sinh viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <span className="text-sm font-medium">Họ tên:</span>
          <span className="text-sm ml-2">{username}</span>
        </div>
        <div>
          <span className="text-sm font-medium">MSSV:</span>
          <span className="text-sm ml-2">{studentId}</span>
        </div>
        <div>
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm ml-2">{email}</span>
        </div>
      </CardContent>
    </Card>
  )
}
