import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, FileText, Award, Edit2, Trash2 } from "lucide-react";
import type { CouncilWithDetails } from "@/lib/hooks/use-councils";
import type { Grade_defences } from "@/types/database";

interface CouncilCardProps {
  council: CouncilWithDetails;
  profile: any;
  userRoles: string[];
  selectedCouncil: CouncilWithDetails | null;
  setSelectedCouncil: (council: CouncilWithDetails | null) => void;
  gradingStudents: {[key: string]: number};
  setGradingStudents: (students: {[key: string]: number}) => void;
  formatTimestamp: (timestamp: any) => Date;
  handleGradeSubmit: (enrollmentId: string, gradeCode: string | undefined, studentCode: string) => void;
  getPositionLabel: (position: string) => string;
  getPositionColor: (position: string) => string;
  onDeleteSchedule?: (scheduleId: string) => void;
  onEditSchedule?: (topic: any) => void;
}

export function CouncilCard({
  council,
  profile,
  userRoles,
  selectedCouncil,
  setSelectedCouncil,
  gradingStudents,
  setGradingStudents,
  formatTimestamp,
  handleGradeSubmit,
  getPositionLabel,
  getPositionColor,
  onDeleteSchedule,
  onEditSchedule,
}: CouncilCardProps) {
  const canManageSchedule = userRoles.includes("Academic_affairs_staff") || userRoles.includes("Department_Lecturer");
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{council.title}</h3>

          {/* Council Info */}
          <div className="mb-4 space-y-3">
            {/* Show topics with their schedules */}
            {council.topics && council.topics.length > 0 && (
              <div className="space-y-2">
                {council.topics.map((topic, index) => (
                  <div key={topic.id || index} className="border-l-2 border-primary pl-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-0.5">Đề tài:</p>
                          <p className="text-sm text-muted-foreground">{topic.title}</p>
                        </div>
                      </div>
                      {canManageSchedule && topic.schedule?.id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => onEditSchedule?.(topic)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Bạn có chắc muốn xóa lịch này?")) {
                                onDeleteSchedule?.(topic.schedule!.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {topic.schedule?.time_start && (
                      <div className="flex items-start gap-3 ml-8">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="text-xs font-medium">
                              {formatTimestamp(topic.schedule.time_start).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(topic.schedule.time_start).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {topic.schedule.time_end && (
                              <>
                                {" - "}
                                {formatTimestamp(topic.schedule.time_end).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </>
                            )}
                            {" (UTC+7)"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(!council.topics || council.topics.length === 0) && (
              <p className="text-sm text-orange-600">Chưa có đề tài nào được xếp lịch</p>
            )}
          </div>

          {/* Council Members */}
          {council.defences && council.defences.length > 0 && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-3">Thành viên hội đồng:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {council.defences.map((defence) => (
                  <div key={defence.id} className="flex items-center gap-2">
                    <Badge className={getPositionColor(defence.position)}>
                      {getPositionLabel(defence.position)}
                    </Badge>
                    <span className="text-sm">{defence.teacher?.username || "N/A"}</span>
                    {defence.teacher?.id === profile?.id && (
                      <Badge variant="outline" className="ml-auto">Bạn</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grading Section */}
          {(council.userPosition === "chairman" || council.userPosition === "president" || council.userPosition === "secretary") && council.enrollments && council.enrollments.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Chấm điểm {council.userPosition === "chairman" || council.userPosition === "president" ? "chủ tịch" : "thư ký"}
                </h4>
                {selectedCouncil?.id !== council.id && (
                  <Button size="sm" onClick={() => setSelectedCouncil(council)}>
                    Chấm điểm
                  </Button>
                )}
              </div>

              {selectedCouncil?.id === council.id && (
                <div className="space-y-3">
                  {council.enrollments.map((enrollment) => {
                    const gradeField = council.userPosition === "chairman" || council.userPosition === "president" ? "council" : "secretary";
                    const currentGrade = enrollment.gradeDefence?.[gradeField as keyof Grade_defences];

                    return (
                      <div key={enrollment.id} className="p-3 bg-muted/50 rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{enrollment.student?.id} - {enrollment.student?.username}</p>
                            {currentGrade !== null && currentGrade !== undefined && typeof currentGrade === 'number' && (
                              <p className="text-sm text-muted-foreground">Điểm hiện tại: {currentGrade}/10</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="Nhập điểm (0-10)"
                            value={gradingStudents[enrollment.id] || ""}
                            onChange={(e) => setGradingStudents({
                              ...gradingStudents,
                              [enrollment.id]: parseFloat(e.target.value)
                            })}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleGradeSubmit(enrollment.id, enrollment.grade_code, enrollment.student_code)}
                          >
                            Lưu
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCouncil(null);
                      setGradingStudents({});
                    }}
                  >
                    Đóng
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
