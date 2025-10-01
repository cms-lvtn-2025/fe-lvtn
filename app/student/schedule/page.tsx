"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, MapPin, Users, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useSemester } from "@/lib/contexts/semester-context"
import { useTopicDetails } from "@/lib/hooks/use-topic-details"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export default function StudentSchedulePage() {
  const { profile } = useAuth()
  const { currentSemester } = useSemester()
  const { topics, isLoading } = useTopicDetails(profile?.id, currentSemester?.id)

  // Filter topics that have council info
  const topicsWithCouncil = topics.filter(t => t.council_info)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lịch hẹn bảo vệ</h1>
          <p className="text-muted-foreground">
            Xem lịch bảo vệ luận văn và thông tin hội đồng
          </p>
        </div>

        {topicsWithCouncil.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chưa có lịch bảo vệ nào được xếp. Vui lòng chờ thông báo từ giáo vụ.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {topicsWithCouncil.map((topic) => {
              const { council_info } = topic
              if (!council_info) return null

              const timeStart = council_info.time_start ? new Date(council_info.time_start) : null
              const timeEnd = council_info.time_end ? new Date(council_info.time_end) : null

              return (
                <Card key={topic.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {council_info.title}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="ml-4">
                        Đã xếp lịch
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Date and Time Display */}
                      <div className="grid md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Ngày bảo vệ
                              </p>
                              <p className="text-lg font-bold">
                                {timeStart
                                  ? format(timeStart, "EEEE, dd/MM/yyyy", { locale: vi })
                                  : "Chưa xác định"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Thời gian
                              </p>
                              {timeStart && timeEnd ? (
                                <p className="text-lg font-bold">
                                  {format(timeStart, "HH:mm")} - {format(timeEnd, "HH:mm")}
                                </p>
                              ) : (
                                <p className="text-lg font-bold">Chưa xác định</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline View */}
                      {timeStart && timeEnd && (
                        <div className="p-4 bg-secondary rounded-lg">
                          <h4 className="text-sm font-semibold mb-3">Thời gian biểu</h4>
                          <div className="relative pl-6 border-l-2 border-primary">
                            <div className="mb-4 relative">
                              <div className="absolute -left-[1.6rem] mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-primary">
                                  {format(timeStart, "HH:mm")}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Bắt đầu bảo vệ
                                </span>
                              </div>
                            </div>

                            <div className="mb-4 pl-4 border-l-2 border-dashed border-muted-foreground/30 ml-[-1px]">
                              <div className="py-2 text-sm text-muted-foreground">
                                <p>• Trình bày nội dung luận văn</p>
                                <p>• Trả lời câu hỏi hội đồng</p>
                                <p>• Nhận xét và đánh giá</p>
                              </div>
                            </div>

                            <div className="relative">
                              <div className="absolute -left-[1.6rem] mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-primary">
                                  {format(timeEnd, "HH:mm")}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Kết thúc
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Council Members */}
                      {council_info.members && council_info.members.length > 0 && (
                        <div className="p-4 bg-secondary rounded-lg">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Thành viên hội đồng
                          </h4>
                          <div className="space-y-2">
                            {council_info.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-2 bg-background rounded border"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                      {member.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {member.position_title}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline">{member.position_title}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                          <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-200">
                            <li>Có mặt trước giờ bảo vệ ít nhất 15 phút</li>
                            <li>Chuẩn bị đầy đủ tài liệu và bản trình bày</li>
                            <li>Ăn mặc lịch sự, trang trọng</li>
                          </ul>
                        </div>
                      </div>

                      {/* Topic Info */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Thông tin luận văn</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Giảng viên hướng dẫn:</span>
                            <span className="font-medium">{topic.teacher_supervisor_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chuyên ngành:</span>
                            <span className="font-medium">{topic.major_name}</span>
                          </div>
                          {topic.defense_grade && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Điểm hội đồng:</span>
                              <span className="font-bold text-primary">{topic.defense_grade}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
