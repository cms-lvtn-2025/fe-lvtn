"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import { TopicStatus } from "@/types/database"
import Link from "next/link"

interface TopicListItem {
  id: string
  title: string
  status: TopicStatus
  teacher_supervisor_name?: string
}

interface TopicListCardProps {
  topics: TopicListItem[]
  statusConfig: Record<
    TopicStatus,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  >
}

const getProgressValue = (status: TopicStatus): number => {
  switch (status) {
    case TopicStatus.PENDING:
      return 0
    case TopicStatus.APPROVED:
      return 33
    case TopicStatus.IN_PROGRESS:
      return 66
    case TopicStatus.COMPLETED:
      return 100
    default:
      return 0
  }
}

const getProgressLabel = (status: TopicStatus): string => {
  switch (status) {
    case TopicStatus.PENDING:
      return "0%"
    case TopicStatus.APPROVED:
      return "33%"
    case TopicStatus.IN_PROGRESS:
      return "66%"
    case TopicStatus.COMPLETED:
      return "100%"
    default:
      return "0%"
  }
}

export function TopicListCard({ topics, statusConfig }: TopicListCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Luận văn của tôi</CardTitle>
          <CardDescription>Danh sách luận văn đang thực hiện</CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-8"
            >
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Chưa có luận văn nào được phân công</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {topics.slice(0, 3).map((topic, index) => {
                const StatusIcon = statusConfig[topic.status].icon
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{topic.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          GVHD: {topic.teacher_supervisor_name}
                        </p>
                      </div>
                      <Badge className={`${statusConfig[topic.status].color} text-white ml-2`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[topic.status].label}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tiến độ</span>
                        <span>{getProgressLabel(topic.status)}</span>
                      </div>
                      <Progress value={getProgressValue(topic.status)} />
                    </div>
                  </motion.div>
                )
              })}
              {topics.length > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/student/thesis">Xem tất cả ({topics.length})</Link>
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
