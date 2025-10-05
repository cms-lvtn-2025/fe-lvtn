"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Topic, councils_schedule } from "@/types/database";

interface EditScheduleModalProps {
  topic: Topic & { schedule?: councils_schedule };
  councilId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditScheduleModal({
  topic,
  councilId,
  onClose,
  onSuccess,
}: EditScheduleModalProps) {
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (topic.schedule?.time_start) {
      const start = topic.schedule.time_start instanceof Date
        ? topic.schedule.time_start
        : new Date((topic.schedule.time_start as any).seconds * 1000);
      setTimeStart(formatDateTimeLocal(start));
    }
    if (topic.schedule?.time_end) {
      const end = topic.schedule.time_end instanceof Date
        ? topic.schedule.time_end
        : new Date((topic.schedule.time_end as any).seconds * 1000);
      setTimeEnd(formatDateTimeLocal(end));
    }
  }, [topic]);

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateTimeSlot = async () => {
    if (!topic.schedule?.id) return true;

    const schedulesRef = collection(db, COLLECTIONS.COUNCILS_SCHEDULE);
    const schedulesQuery = query(schedulesRef, where("councils_code", "==", councilId));
    const snapshot = await getDocs(schedulesQuery);

    const newStart = new Date(timeStart);
    const newEnd = new Date(timeEnd);

    for (const docSnap of snapshot.docs) {
      // Skip current schedule
      if (docSnap.id === topic.schedule.id) continue;

      const schedule = docSnap.data() as councils_schedule;
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
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!timeStart || !timeEnd) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (new Date(timeStart) >= new Date(timeEnd)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    if (!topic.schedule?.id) {
      setError("Không tìm thấy lịch để cập nhật");
      return;
    }

    setLoading(true);

    try {
      const isValid = await validateTimeSlot();
      if (!isValid) {
        setError("Thời gian bị trùng với lịch khác trong hội đồng này");
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, COLLECTIONS.COUNCILS_SCHEDULE, topic.schedule.id), {
        time_start: new Date(timeStart),
        time_end: new Date(timeEnd),
        updated_at: new Date(),
      });

      alert("Cập nhật lịch thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError("Có lỗi khi cập nhật lịch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Chỉnh sửa lịch bảo vệ</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-50 text-red-900 border-red-200">
            {error}
          </Alert>
        )}

        <div className="mb-4 p-3 bg-muted rounded">
          <p className="text-sm font-medium">Đề tài:</p>
          <p className="text-sm text-muted-foreground">{topic.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
