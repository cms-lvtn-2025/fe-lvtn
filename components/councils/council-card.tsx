import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, FileText, Award } from "lucide-react";
import type { CouncilWithDetails } from "@/lib/hooks/use-councils";
import type { Grade_defences, Topic } from "@/types/database";

interface CouncilCardProps {
  council: CouncilWithDetails;
  profile: any;
  canAssignTopic: boolean;
  canGrade: boolean;
  selectedCouncil: CouncilWithDetails | null;
  setSelectedCouncil: (council: CouncilWithDetails | null) => void;
  gradingStudents: {[key: string]: number};
  setGradingStudents: (students: {[key: string]: number}) => void;
  showAssignTopic: string | null;
  availableTopics: Topic[];
  assignLoading: boolean;
  formatTimestamp: (timestamp: any) => Date;
  handleShowAssignTopic: (councilId: string, majorCode: string) => void;
  handleAssignTopic: (councilId: string, topicId: string) => void;
  handleGradeSubmit: (enrollmentId: string, gradeCode: string | undefined, studentCode: string) => void;
  setShowAssignTopic: (councilId: string | null) => void;
  getPositionLabel: (position: string) => string;
  getPositionColor: (position: string) => string;
}

export function CouncilCard({
  council,
  profile,
  canAssignTopic,
  canGrade,
  selectedCouncil,
  setSelectedCouncil,
  gradingStudents,
  setGradingStudents,
  showAssignTopic,
  availableTopics,
  assignLoading,
  formatTimestamp,
  handleShowAssignTopic,
  handleAssignTopic,
  handleGradeSubmit,
  setShowAssignTopic,
  getPositionLabel,
  getPositionColor,
}: CouncilCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{council.title}</h3>

          {/* Council Info */}
          <div className="mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                {council.time_start && (
                  <div className="mb-1">
                    <span className="text-sm font-medium">
                      {formatTimestamp(council.time_start).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {council.time_start &&
                    formatTimestamp(council.time_start).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  {" - "}
                  {council.time_end &&
                    formatTimestamp(council.time_end).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  {" (UTC+7)"}
                </div>
              </div>
            </div>
            {council.topic && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-0.5">Đề tài bảo vệ:</p>
                  <p className="text-sm text-muted-foreground">{council.topic.title}</p>
                </div>
              </div>
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

          {/* Assign Topic Section */}
          {canAssignTopic && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Đề tài bảo vệ:</h4>
                  {council.topic ? (
                    <p className="text-sm text-muted-foreground mt-1">{council.topic.title}</p>
                  ) : (
                    <p className="text-sm text-orange-600 mt-1">Chưa gán đề tài</p>
                  )}
                </div>
                {!council.topic && (
                  <Button size="sm" onClick={() => handleShowAssignTopic(council.id, council.major_code)}>
                    Gán đề tài
                  </Button>
                )}
              </div>

              {showAssignTopic === council.id && (
                <div className="mt-4 space-y-2">
                  <h5 className="font-medium text-sm">Chọn đề tài:</h5>
                  {assignLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                  ) : availableTopics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có đề tài hoàn thành nào</p>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {availableTopics.map(topic => (
                        <div
                          key={topic.id}
                          className="p-3 border rounded-lg cursor-pointer hover:border-primary transition"
                          onClick={() => handleAssignTopic(council.id, topic.id)}
                        >
                          <p className="font-medium text-sm">{topic.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowAssignTopic(null)}>
                    Đóng
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Grading Section */}
          {canGrade && (council.userPosition === "chairman" || council.userPosition === "president" || council.userPosition === "secretary") && council.enrollments && council.enrollments.length > 0 && (
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
