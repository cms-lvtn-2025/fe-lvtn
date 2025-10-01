"use client"

import { useSemester } from "@/lib/contexts/semester-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Check } from "lucide-react"

export function SemesterSelector() {
  const { semesters, currentSemester, setCurrentSemester, isLoading } = useSemester()
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Calendar className="mr-2 h-4 w-4" />
        Đang tải...
      </Button>
    )
  }

  if (semesters.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          {currentSemester?.title || "Chọn học kỳ"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Chọn học kỳ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {semesters.map((semester) => (
          <DropdownMenuItem
            key={semester.id}
            onClick={() => setCurrentSemester(semester)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{semester.title}</span>
              {currentSemester?.id === semester.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
