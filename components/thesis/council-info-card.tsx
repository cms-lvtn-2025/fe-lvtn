import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface CouncilInfoCardProps {
  title: string
  timeStart?: Date
  timeEnd?: Date
}

export function CouncilInfoCard({ title, timeStart, timeEnd }: CouncilInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin hội đồng</CardTitle>
        <CardDescription>Lịch bảo vệ đã được xếp</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm font-medium">Tên hội đồng:</span>
          <p className="text-sm mt-1">{title}</p>
        </div>
        {timeStart && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{new Date(timeStart).toLocaleString("vi-VN")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
