import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface TeamMember {
  id: string
  username: string
  email: string
  student_id: string
}

interface TeamMembersCardProps {
  members: TeamMember[]
}

export function TeamMembersCard({ members }: TeamMembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thành viên nhóm</CardTitle>
        <CardDescription>
          {members.length === 0 ? "Làm việc cá nhân" : `${members.length} thành viên`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="border-l-2 border-primary pl-3">
                <p className="text-sm font-medium">{member.username}</p>
                <p className="text-xs text-muted-foreground">{member.student_id}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Không có thành viên khác</p>
        )}
      </CardContent>
    </Card>
  )
}
