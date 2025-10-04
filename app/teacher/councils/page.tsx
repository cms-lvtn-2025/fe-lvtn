"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getDocuments, COLLECTIONS } from "@/lib/firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Council, Topic, Defence, Teacher } from "@/types/database";
import { Alert } from "@/components/ui/alert";

interface CouncilWithDetails extends Council {
  topic?: Topic | null;
  defences?: Array<Defence & { teacher?: Teacher | null }>;
}

export default function CouncilsPage() {
  const { profile } = useAuth();
  const [councils, setCouncils] = useState<CouncilWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCouncils();
  }, [profile]);

  const loadCouncils = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get councils where teacher is a member (through defences)
      const defencesRef = collection(db, COLLECTIONS.DEFENCES);
      const defencesQuery = query(
        defencesRef,
        where("teacher_code", "==", profile.id)
      );
      const defencesSnapshot = await getDocs(defencesQuery);
      const councilIds = Array.from(
        new Set(defencesSnapshot.docs.map((doc) => doc.data().council_code))
      );
      if (councilIds.length === 0) {
        setCouncils([]);
        setLoading(false);
        return;
      }

      // Get councils
      const councilsRef = collection(db, COLLECTIONS.COUNCILS);
      const councilsSnapshot = await getDocs(councilsRef);
      const allCouncils = councilsSnapshot.docs
        .filter((doc) => councilIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Council));
      console.log(allCouncils);
      // Get topics
      const topicIds = allCouncils.map((c) => c.topic_code).filter(Boolean);
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      const topicsSnapshot = await getDocs(topicsRef);
      const allTopics = topicsSnapshot.docs
        .filter((doc) => topicIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Topic));

      // Get all defences for these councils
      const allDefencesSnapshot = await getDocs(defencesRef);
      const allDefences = allDefencesSnapshot.docs
        .filter((doc) => councilIds.includes(doc.data().council_code))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Defence));

      // Get teachers
      const teacherIds = allDefences.map((d) => d.teacher_code).filter(Boolean);
      const teachersRef = collection(db, COLLECTIONS.TEACHERS);
      const teachersSnapshot = await getDocs(teachersRef);
      const allTeachers = teachersSnapshot.docs
        .filter((doc) => teacherIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Teacher));

      // Map councils with details
      const councilsWithDetails = allCouncils.map((council) => {
        const topic =
          allTopics.find((t) => t.id === council.topic_code) || null;
        const councilDefences = allDefences
          .filter((d) => d.council_code === council.id)
          .map((defence) => ({
            ...defence,
            teacher:
              allTeachers.find((t) => t.id === defence.teacher_code) || null,
          }));

        return {
          ...council,
          topic,
          defences: councilDefences,
        };
      });

      // Sort by date
      councilsWithDetails.sort((a, b) => {
        const aDate = a.time_start
          ? formatTimestamp(a.time_start).getTime()
          : 0;
        const bDate = b.time_start
          ? formatTimestamp(b.time_start).getTime()
          : 0;
        return aDate - bDate;
      });

      setCouncils(councilsWithDetails);
    } catch (error) {
      console.error("Error loading councils:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      chairman: "Chủ tịch",
      secretary: "Thư ký",
      reviewer: "Phản biện",
      member: "Ủy viên",
    };
    return labels[position] || position;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      chairman: "bg-red-50 text-red-700 border-red-200",
      secretary: "bg-blue-50 text-blue-700 border-blue-200",
      reviewer: "bg-purple-50 text-purple-700 border-purple-200",
      member: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[position] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatTimestamp = (timestamp: any) => {
    // Firestore timestamp can be: Timestamp object, seconds (number), or Date
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
    if (typeof timestamp === "number") return new Date(timestamp * 1000); // Unix seconds
    return new Date(timestamp); // Already a Date or string
  };

  const getCouncilsForDate = (date: Date) => {
    return councils.filter((council) => {
      if (!council.time_start) return false;
      const councilDate = formatTimestamp(council.time_start);
      return councilDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of month
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
          <div
            className={`text-sm font-medium mb-1 ${
              isToday ? "text-blue-600" : ""
            }`}
          >
            {day}
          </div>
          {dayCouncils.map((council) => (
            <div
              key={council.id}
              className="text-xs p-1 mb-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
              title={council.title}
            >
              {council.time_start &&
                formatTimestamp(council.time_start).toLocaleTimeString(
                  "vi-VN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}{" "}
              - {council.title}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p>Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

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

        {showCalendar ? (
          /* Calendar View */
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
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
        ) : (
          /* List View */
          <>
            {councils.length === 0 ? (
              <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                <Users className="h-4 w-4" />
                <p>Chưa có hội đồng nào</p>
              </Alert>
            ) : (
              <div className="grid gap-6">
                {councils.map((council) => (
                  <Card key={council.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {council.title}
                        </h3>

                        {/* Council Info */}
                        <div className="mb-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              {council.time_start && (
                                <div className="mb-1">
                                  <span className="text-sm font-medium">
                                    {formatTimestamp(
                                      council.time_start
                                    ).toLocaleDateString("vi-VN", {
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
                                  formatTimestamp(
                                    council.time_start
                                  ).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                {" - "}
                                {council.time_end &&
                                  formatTimestamp(
                                    council.time_end
                                  ).toLocaleTimeString("vi-VN", {
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
                                <p className="text-sm font-medium mb-0.5">
                                  Đề tài bảo vệ:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {council.topic.title}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Council Members */}
                        {council.defences && council.defences.length > 0 && (
                          <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                            <p className="text-sm font-medium mb-3">
                              Thành viên hội đồng:
                            </p>
                            <div className="grid md:grid-cols-2 gap-3">
                              {council.defences.map((defence) => (
                                <div
                                  key={defence.id}
                                  className="flex items-center gap-2"
                                >
                                  <Badge
                                    className={getPositionColor(
                                      defence.position
                                    )}
                                  >
                                    {getPositionLabel(defence.position)}
                                  </Badge>
                                  <span className="text-sm">
                                    {defence.teacher?.username || "N/A"}
                                  </span>
                                  {defence.teacher?.id === profile?.id && (
                                    <Badge
                                      variant="outline"
                                      className="ml-auto"
                                    >
                                      Bạn
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
