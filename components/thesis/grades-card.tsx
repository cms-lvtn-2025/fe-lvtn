import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GradesCardProps {
  midtermGrade?: number
  finalGrade?: number
  defenseGrade?: number
}

export function GradesCard({ midtermGrade, finalGrade, defenseGrade }: GradesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Điểm số</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
          <span className="text-sm font-medium">Điểm giữa kỳ:</span>
          <span className="text-lg font-bold">
            {midtermGrade ? `${midtermGrade}/10` : "Chưa có"}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
          <span className="text-sm font-medium">Điểm cuối kỳ:</span>
          <span className="text-lg font-bold">
            {finalGrade ? `${finalGrade}/10` : "Chưa có"}
          </span>
        </div>
        {defenseGrade && (
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Điểm hội đồng:</span>
            <span className="text-lg font-bold text-primary">{defenseGrade}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
