"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import type { CouncilWithDetails } from "@/lib/hooks/use-councils";

interface SelectCouncilModalProps {
  councils: CouncilWithDetails[];
  onSelect: (council: CouncilWithDetails) => void;
  onClose: () => void;
}

export function SelectCouncilModal({
  councils,
  onSelect,
  onClose,
}: SelectCouncilModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Chọn hội đồng để tạo lịch</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {councils.map((council) => (
            <div
              key={council.id}
              className="p-4 border rounded-lg hover:border-primary cursor-pointer transition"
              onClick={() => onSelect(council)}
            >
              <h3 className="font-semibold mb-1">{council.title}</h3>
              <p className="text-sm text-muted-foreground">
                Số lượng đề tài đã xếp lịch: {council.topics?.length || 0}
              </p>
            </div>
          ))}
          {councils.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Không có hội đồng nào
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
