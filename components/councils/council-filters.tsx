import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface CouncilFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function CouncilFilters({
  searchInput,
  setSearchInput,
  dateFilter,
  setDateFilter,
  onSearch,
  onClear,
}: CouncilFiltersProps) {
  return (
    <Card className="p-4 mb-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Tìm kiếm (Title/MSSV)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập từ khóa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <Button onClick={onSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <Label>Lọc theo ngày</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={onClear}>
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </Card>
  );
}
