"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Council, Topic, councils_schedule } from "@/types/database";

interface CreateScheduleModalProps {
  council: Council;
  userRoles: string[];
  profile: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateScheduleModal({
  council,
  userRoles,
  profile,
  onClose,
  onSuccess,
}: CreateScheduleModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCreateSchedule = userRoles.includes("Academic_affairs_staff") || userRoles.includes("Department_Lecturer");

  useEffect(() => {
    loadAvailableTopics();
  }, []);

  const loadAvailableTopics = async () => {
    try {
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      let q;

      if (userRoles.includes("Academic_affairs_staff")) {
        // Academic staff: all completed topics matching council's major
        q = query(
          topicsRef,
          where("major_code", "==", council.major_code),
          where("semester_code", "==", profile.semester_code),
          where("status", "==", "approved")
        );
      } else if (userRoles.includes("Department_Lecturer")) {
        // Department lecturer: only their major's completed topics
        q = query(
          topicsRef,
          where("major_code", "==", profile.major_code),
          where("semester_code", "==", profile.semester_code),
          where("status", "==", "approved")
        );
      } else {
        setTopics([]);
        return;
      }

      const snapshot = await getDocs(q);
      const allTopics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));

      // Filter out topics already scheduled in this council
      const schedulesRef = collection(db, COLLECTIONS.COUNCILS_SCHEDULE);
      const schedulesQuery = query(schedulesRef, where("councils_code", "==", council.id));
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const scheduledTopicIds = schedulesSnapshot.docs.map(doc => doc.data().topic_code);

      const availableTopics = allTopics.filter(t => !scheduledTopicIds.includes(t.id));
      setTopics(availableTopics);
    } catch (err) {
      console.error("Error loading topics:", err);
      setError("Không thể tải danh sách đề tài");
    }
  };

  const validateTimeSlot = async () => {
    // Check if time slot conflicts with existing schedules in this council
    const schedulesRef = collection(db, COLLECTIONS.COUNCILS_SCHEDULE);
    const schedulesQuery = query(schedulesRef, where("councils_code", "==", council.id));
    const snapshot = await getDocs(schedulesQuery);

    const newStart = new Date(timeStart);
    const newEnd = new Date(timeEnd);

    for (const doc of snapshot.docs) {
      const schedule = doc.data() as councils_schedule;
      if (!schedule.time_start || !schedule.time_end) continue;

      const existingStart = schedule.time_start instanceof Date
        ? schedule.time_start
        : new Date((schedule.time_start as any).seconds * 1000);
      const existingEnd = schedule.time_end instanceof Date
        ? schedule.time_end
        : new Date((schedule.time_end as any).seconds * 1000);

      // Check for time overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return false; // Time slot conflict
      }
    }

    return true; // No conflict
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedTopicId || !timeStart || !timeEnd) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const selectedTopic = topics.find(t => t.id === selectedTopicId);
    if (!selectedTopic) {
      setError("Đề tài không hợp lệ");
      return;
    }

    // Validate major match
    if (selectedTopic.major_code !== council.major_code) {
      setError("Đề tài phải cùng bộ môn với hội đồng");
      return;
    }

    // Validate time
    if (new Date(timeStart) >= new Date(timeEnd)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    setLoading(true);

    try {
      // Check time slot conflict
      const isValid = await validateTimeSlot();
      if (!isValid) {
        setError("Thời gian bị trùng với lịch khác trong hội đồng này");
        setLoading(false);
        return;
      }

      // Create schedule
      await addDoc(collection(db, COLLECTIONS.COUNCILS_SCHEDULE), {
        councils_code: council.id,
        topic_code: selectedTopicId,
        time_start: new Date(timeStart),
        time_end: new Date(timeEnd),
        created_at: new Date(),
        updated_at: new Date(),
        created_by: profile.id,
        updated_by: profile.id,
      });

      alert("Tạo lịch bảo vệ thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError("Có lỗi khi tạo lịch");
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateSchedule) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Tạo lịch bảo vệ - {council.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Chọn đề tài</Label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">-- Chọn đề tài --</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
            {topics.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Không có đề tài nào khả dụng
              </p>
            )}
          </div>

          <div>
            <Label>Thời gian bắt đầu</Label>
            <Input
              type="datetime-local"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Thời gian kết thúc</Label>
            <Input
              type="datetime-local"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || topics.length === 0}>
              {loading ? "Đang tạo..." : "Tạo lịch"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
