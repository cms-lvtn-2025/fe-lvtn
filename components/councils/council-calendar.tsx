import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { CouncilWithDetails } from "@/lib/hooks/use-councils";
import { useState } from "react";
import type { Topic } from "@/types/database";

interface CouncilCalendarProps {
  councils: CouncilWithDetails[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  formatTimestamp: (timestamp: any) => Date;
  canCreateSchedule?: boolean;
  onCreateSchedule?: () => void;
}

interface ScheduleDetail {
  council: CouncilWithDetails;
  topic: Topic & { schedule?: any };
}

export function CouncilCalendar({
  councils,
  currentDate,
  setCurrentDate,
  formatTimestamp,
  canCreateSchedule,
  onCreateSchedule,
}: CouncilCalendarProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDetail | null>(null);

  // Generate consistent colors for councils
  const councilColors = [
    "bg-blue-500/20 text-blue-700 border-blue-300",
    "bg-green-500/20 text-green-700 border-green-300",
    "bg-purple-500/20 text-purple-700 border-purple-300",
    "bg-orange-500/20 text-orange-700 border-orange-300",
    "bg-pink-500/20 text-pink-700 border-pink-300",
    "bg-teal-500/20 text-teal-700 border-teal-300",
    "bg-red-500/20 text-red-700 border-red-300",
    "bg-indigo-500/20 text-indigo-700 border-indigo-300",
    "bg-yellow-500/20 text-yellow-700 border-yellow-300",
    "bg-cyan-500/20 text-cyan-700 border-cyan-300",
  ];

  const getCouncilColor = (councilId: string) => {
    const index = councils.findIndex((c) => c.id === councilId);
    return councilColors[index % councilColors.length];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getSchedulesForDate = (date: Date) => {
    const schedules: ScheduleDetail[] = [];
    councils.forEach((council) => {
      council.topics?.forEach(topic => {
        if (!topic.schedule?.time_start) return;
        const scheduleDate = formatTimestamp(topic.schedule.time_start);
        if (scheduleDate.toDateString() === date.toDateString()) {
          schedules.push({ council, topic });
        }
      });
    });
    // Sort by time_start, then time_end
    return schedules.sort((a, b) => {
      const aStart = formatTimestamp(a.topic.schedule.time_start).getTime();
      const bStart = formatTimestamp(b.topic.schedule.time_start).getTime();
      if (aStart !== bStart) return aStart - bStart;

      const aEnd = formatTimestamp(a.topic.schedule.time_end).getTime();
      const bEnd = formatTimestamp(b.topic.schedule.time_end).getTime();
      return aEnd - bEnd;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySchedules = getSchedulesForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`p-2 min-h-24 border border-border ${
            isToday ? "bg-blue-50" : "bg-card"
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
            {day}
          </div>
          {daySchedules.map((schedule, idx) => {
            const startTime = formatTimestamp(schedule.topic.schedule.time_start);
            const endTime = formatTimestamp(schedule.topic.schedule.time_end);
            return (
              <div
                key={`${schedule.council.id}-${schedule.topic.id}-${idx}`}
                className={`text-xs p-1.5 mb-1 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getCouncilColor(schedule.council.id!)}`}
                onClick={() => setSelectedSchedule(schedule)}
                title={`${schedule.council.title} - ${schedule.topic.title}`}
              >
                <div className="font-semibold truncate">{schedule.council.title}</div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {startTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  - {endTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            {canCreateSchedule && onCreateSchedule && (
              <Button size="sm" onClick={onCreateSchedule}>
                Tạo lịch hội đồng
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hôm nay
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-semibold text-sm bg-secondary"
            >
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </Card>

      {selectedSchedule && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedSchedule(null)}
        >
          <Card
            className="p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">Chi tiết lịch bảo vệ</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSchedule(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hội đồng</label>
                <p className="text-lg font-semibold">{selectedSchedule.council.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Đề tài</label>
                <p className="text-lg">{selectedSchedule.topic.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thời gian bắt đầu</label>
                  <p className="text-base">
                    {formatTimestamp(selectedSchedule.topic.schedule.time_start).toLocaleString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thời gian kết thúc</label>
                  <p className="text-base">
                    {formatTimestamp(selectedSchedule.topic.schedule.time_end).toLocaleString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {selectedSchedule.council.defences && selectedSchedule.council.defences.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thành viên hội đồng</label>
                  <div className="mt-2 space-y-2">
                    {selectedSchedule.council.defences.map((defence) => (
                      <div key={defence.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                        <div>
                          <p className="font-medium">{defence.teacher?.username || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{defence.teacher?.email}</p>
                        </div>
                        <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                          {defence.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSchedule.council.enrollments && selectedSchedule.council.enrollments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sinh viên bảo vệ</label>
                  <div className="mt-2 space-y-2">
                    {selectedSchedule.council.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="p-2 bg-secondary/50 rounded">
                        <p className="font-medium">{enrollment.student?.username || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.student?.email}</p>
                        {enrollment.gradeDefence && (
                          <p className="text-sm mt-1">
                            Điểm hội đồng: <span className="font-semibold">{enrollment.gradeDefence.council || "N/A"}</span>
                            {enrollment.gradeDefence.secretary && (
                              <> | Thư ký: <span className="font-semibold">{enrollment.gradeDefence.secretary}</span></>
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
