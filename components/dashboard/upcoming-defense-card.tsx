"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"

// Helper function to convert Firestore timestamp to Date
const toDate = (timestamp: any): Date | null => {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  if (timestamp.toDate) return timestamp.toDate()
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000)
  try {
    return new Date(timestamp)
  } catch {
    return null
  }
}

interface CouncilMember {
  id: string
  name: string
  position_title: string
}

interface UpcomingDefense {
  id: string
  title: string
  council_info?: {
    title: string
    time_start?: Date
    time_end?: Date
    members?: CouncilMember[]
  }
}

interface UpcomingDefenseCardProps {
  upcomingDefense?: UpcomingDefense
}

export function UpcomingDefenseCard({ upcomingDefense }: UpcomingDefenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Lịch bảo vệ sắp tới</CardTitle>
          <CardDescription>Thông tin buổi bảo vệ gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDefense && upcomingDefense.council_info ? (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-primary/5 rounded-lg border border-primary/20"
              >
                <h4 className="font-semibold mb-2">{upcomingDefense.title}</h4>
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      {upcomingDefense.council_info.title}
                    </span>
                  </motion.div>
                  {(() => {
                    const startDate = toDate(upcomingDefense.council_info.time_start)
                    const endDate = toDate(upcomingDefense.council_info.time_end)

                    return startDate ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(startDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                          </span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(startDate, "HH:mm")}
                            {endDate && ` - ${format(endDate, "HH:mm")}`}
                          </span>
                        </motion.div>
                      </>
                    ) : null
                  })()}
                </div>
              </motion.div>

              {upcomingDefense.council_info.members &&
                upcomingDefense.council_info.members.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h5 className="text-sm font-medium mb-2">Thành viên hội đồng:</h5>
                    <div className="space-y-2">
                      {upcomingDefense.council_info.members.slice(0, 3).map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.position_title}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Button className="w-full" asChild>
                  <Link href="/student/schedule">Xem chi tiết lịch hẹn</Link>
                </Button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-8"
            >
              <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Chưa có lịch bảo vệ được xếp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bạn sẽ nhận được thông báo khi có lịch mới
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
