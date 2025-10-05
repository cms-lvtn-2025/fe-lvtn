"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Calendar, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCouncils } from "@/lib/hooks/use-councils";
import { CouncilCard } from "@/components/councils/council-card";
import { CouncilCalendar } from "@/components/councils/council-calendar";
import { CouncilFilters } from "@/components/councils/council-filters";
import { getPositionLabel, getPositionColor } from "@/lib/utils/council-utils";

export default function CouncilsPage() {
  const { profile, userRoles } = useAuth();
  const {
    councils,
    loading,
    selectedCouncil,
    setSelectedCouncil,
    gradingStudents,
    setGradingStudents,
    formatTimestamp,
    handleGradeSubmit,
  } = useCouncils({ profile, userRoles });

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p>Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setDateFilter("");
  };

  const filteredCouncils = councils.filter(council => {
    if (dateFilter) {
      // Check if any topic schedule matches the date filter
      const hasMatchingDate = council.topics?.some(topic => {
        if (!topic.schedule?.time_start) return false;
        const scheduleDate = formatTimestamp(topic.schedule.time_start).toISOString().split('T')[0];
        return scheduleDate === dateFilter;
      });
      if (!hasMatchingDate) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = council.title?.toLowerCase().includes(term);
      const matchStudent = council.enrollments?.some(e =>
        e.student?.id?.toLowerCase().includes(term) ||
        e.student?.username?.toLowerCase().includes(term)
      );
      if (!matchTitle && !matchStudent) return false;
    }

    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hội đồng bảo vệ</h1>
            <p className="text-muted-foreground">
              Danh sách hội đồng bạn tham gia
            </p>
          </div>
          <Button
            onClick={() => setShowCalendar(!showCalendar)}
            variant={showCalendar ? "default" : "outline"}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showCalendar ? "Xem danh sách" : "Xem lịch"}
          </Button>
        </div>

        {!showCalendar && (
          <CouncilFilters
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onSearch={handleSearch}
            onClear={handleClearFilters}
          />
        )}

        {showCalendar ? (
          <CouncilCalendar
            councils={councils}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            formatTimestamp={formatTimestamp}
          />
        ) : (
          <>
            {filteredCouncils.length === 0 ? (
              <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                <Users className="h-4 w-4" />
                <p>{councils.length === 0 ? "Chưa có hội đồng nào" : "Không tìm thấy hội đồng phù hợp"}</p>
              </Alert>
            ) : (
              <div className="grid gap-6">
                {filteredCouncils.map((council) => (
                  <CouncilCard
                    key={council.id}
                    council={council}
                    profile={profile}
                    selectedCouncil={selectedCouncil}
                    setSelectedCouncil={setSelectedCouncil}
                    gradingStudents={gradingStudents}
                    setGradingStudents={setGradingStudents}
                    formatTimestamp={formatTimestamp}
                    handleGradeSubmit={handleGradeSubmit}
                    getPositionLabel={getPositionLabel}
                    getPositionColor={getPositionColor}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
