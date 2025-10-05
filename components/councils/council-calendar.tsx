import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CouncilWithDetails } from "@/lib/hooks/use-councils";

interface CouncilCalendarProps {
  councils: CouncilWithDetails[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  formatTimestamp: (timestamp: any) => Date;
  canCreateSchedule?: boolean;
  onCreateSchedule?: () => void;
}

export function CouncilCalendar({
  councils,
  currentDate,
  setCurrentDate,
  formatTimestamp,
  canCreateSchedule,
  onCreateSchedule,
}: CouncilCalendarProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getCouncilsForDate = (date: Date) => {
    return councils.filter((council) => {
      // Check if any topic in this council has a schedule for this date
      return council.topics?.some(topic => {
        if (!topic.schedule?.time_start) return false;
        const scheduleDate = formatTimestamp(topic.schedule.time_start);
        return scheduleDate.toDateString() === date.toDateString();
      });
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
      const dayCouncils = getCouncilsForDate(date);
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
          {dayCouncils.map((council) => {
            // Get first topic's schedule time for display
            const firstSchedule = council.topics?.find(t => t.schedule?.time_start)?.schedule;
            return (
              <div
                key={council.id}
                className="text-xs p-1 mb-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                title={council.title}
              >
                {firstSchedule?.time_start &&
                  formatTimestamp(firstSchedule.time_start).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                - {council.title}
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
  );
}
