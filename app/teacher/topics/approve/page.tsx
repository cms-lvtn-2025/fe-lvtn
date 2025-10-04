"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  getDocuments,
  updateDocument,
  COLLECTIONS,
} from "@/lib/firebase/firestore";
import { collection, query, where, orderBy, limit, startAfter, getDocs, type DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Topic, Enrollment, Student } from "@/types/database";
import { Alert } from "@/components/ui/alert";

interface TopicWithStudent extends Topic {
  enrollment?: Enrollment | null;
  student?: Student | null;
}

export default function ApproveTopicPage() {
  const { profile, userRoles } = useAuth();
  const [topics, setTopics] = useState<TopicWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicWithStudent | null>(null);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Search and pagination states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"all" | "title" | "student">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [firstDoc, setFirstDoc] = useState<DocumentSnapshot | null>(null);
  const [pageCache, setPageCache] = useState<Map<number, { topics: TopicWithStudent[], lastDoc: DocumentSnapshot | null, firstDoc: DocumentSnapshot | null }>>(new Map());
  const itemsPerPage = 5;

  useEffect(() => {
    loadPendingTopics();
  }, [profile, currentPage, searchTerm, searchField]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
    setPageCache(new Map());
  };

  const loadPendingTopics = async () => {
    if (!profile?.semester_code) return;

    try {
      setLoading(true);

      // Check cache first
      const cached = pageCache.get(currentPage);
      if (cached && !searchTerm) {
        setTopics(cached.topics);
        setLastDoc(cached.lastDoc);
        setFirstDoc(cached.firstDoc);
        setLoading(false);
        return;
      }

      // Build query with index support
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      let constraints: any[] = [
        where("teacher_supervisor_code", "==", profile.id),
        where("status", "==", "pending"),
        where("semester_code", "==", profile.semester_code),
      ];

      // Add search filter if exists (only for title)
      if (searchTerm && searchField === "title") {
        constraints.push(
          where("title", ">=", searchTerm),
          where("title", "<=", searchTerm + "\uf8ff")
        );
      }

      // Add ordering and pagination
      constraints.push(orderBy("created_at", "desc"));

      // For pagination: use startAfter for pages > 1
      if (currentPage > 1 && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(itemsPerPage));

      const q = query(topicsRef, ...constraints);
      const snapshot = await getDocs(q);

      // Get first and last document for pagination
      const docs = snapshot.docs;
      const newFirstDoc = docs[0] || null;
      const newLastDoc = docs[docs.length - 1] || null;

      // Get topics data
      const pendingTopics = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Topic));

      // Get total count (only on first load)
      if (currentPage === 1 && !searchTerm) {
        const countQuery = query(topicsRef,
          where("teacher_supervisor_code", "==", profile.id),
          where("status", "==", "pending"),
          where("semester_code", "==", profile.semester_code)
        );
        const countSnapshot = await getDocs(countQuery);
        setTotalCount(countSnapshot.size);
      }

      // Get enrollments and students for current page only
      const enrollmentIds = pendingTopics
        .map(t => t.enrollment_code)
        .filter(Boolean);

      let allEnrollments: Enrollment[] = [];
      let allStudents: Student[] = [];

      if (enrollmentIds.length > 0) {
        // Get enrollments in batch
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
        const enrollmentsSnapshot = await getDocs(enrollmentsRef);
        allEnrollments = enrollmentsSnapshot.docs
          .filter(doc => enrollmentIds.includes(doc.id))
          .map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));

        // Get students
        const studentIds = allEnrollments
          .map(e => e.student_code)
          .filter(Boolean);

        if (studentIds.length > 0) {
          const studentsRef = collection(db, COLLECTIONS.STUDENTS);
          const studentsSnapshot = await getDocs(studentsRef);
          allStudents = studentsSnapshot.docs
            .filter(doc => studentIds.includes(doc.id))
            .map(doc => ({ id: doc.id, ...doc.data() } as Student));
        }
      }

      // Map topics with student data
      const topicsWithStudents = pendingTopics.map((topic) => {
        let enrollmentData = null;
        let studentData = null;

        if (topic.enrollment_code) {
          enrollmentData = allEnrollments.find(e => e.id === topic.enrollment_code) || null;
        }

        if (enrollmentData?.student_code) {
          studentData = allStudents.find(s => s.id === enrollmentData.student_code) || null;
        }

        return {
          ...topic,
          enrollment: enrollmentData,
          student: studentData,
        };
      });

      // Filter by student name/id on client side (since Firestore doesn't support this directly)
      let filteredTopics = topicsWithStudents;
      if (searchTerm && (searchField === "student" || searchField === "all")) {
        const term = searchTerm.toLowerCase();
        filteredTopics = topicsWithStudents.filter(topic =>
          topic.student?.username?.toLowerCase().includes(term) ||
          topic.student?.id?.toLowerCase().includes(term) ||
          topic.student?.email?.toLowerCase().includes(term)
        );
      }

      setTopics(filteredTopics);
      setLastDoc(newLastDoc);
      setFirstDoc(newFirstDoc);

      // Cache the page
      if (!searchTerm) {
        setPageCache(prev => new Map(prev).set(currentPage, {
          topics: filteredTopics,
          lastDoc: newLastDoc,
          firstDoc: newFirstDoc
        }));
      }

    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (topicId: string) => {
    try {
      setActionLoading(true);
      await updateDocument(
        COLLECTIONS.TOPICS,
        topicId,
        {
          status: "approved",
          approval_note: feedback || "Đề tài được duyệt",
        },
        profile?.id
      );

      // Reload topics
      await loadPendingTopics();
      setSelectedTopic(null);
      setFeedback("");
    } catch (error) {
      console.error("Error approving topic:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (topicId: string) => {
    if (!feedback.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setActionLoading(true);
      await updateDocument(
        COLLECTIONS.TOPICS,
        topicId,
        {
          status: "rejected",
          rejection_reason: feedback,
        },
        profile?.id
      );

      // Reload topics
      await loadPendingTopics();
      setSelectedTopic(null);
      setFeedback("");
    } catch (error) {
      console.error("Error rejecting topic:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset search input when clearing
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setSearchField("all");
    setCurrentPage(1);
    setPageCache(new Map());
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Duyệt đề tài</h1>
          <p className="text-muted-foreground">
            Xem xét và phê duyệt các đề tài đang chờ
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đề tài hoặc sinh viên..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="px-3 py-2 border border-border rounded-md bg-background"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as any)}
            >
              <option value="all">Tất cả</option>
              <option value="title">Tên đề tài</option>
              <option value="student">Sinh viên</option>
            </select>
            <Button onClick={handleSearch} size="sm">
              <Search className="w-4 h-4 mr-2" />
              Tìm
            </Button>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
              >
                Xóa
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Hiển thị <strong>{topics.length}</strong> đề tài
            {!searchTerm && totalCount > 0 && ` (Tổng: ${totalCount})`}
          </p>
        </Card>

        {topics.length === 0 ? (
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <Clock className="h-4 w-4" />
            <p>{searchTerm ? "Không tìm thấy đề tài phù hợp" : "Không có đề tài nào đang chờ duyệt"}</p>
          </Alert>
        ) : (
          <>
            <div className="grid gap-6">
              {topics.map((topic) => (
              <Card key={topic.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{topic.title}</h3>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ duyệt
                      </Badge>
                    </div>

                    {/* Student Information */}
                    {topic.student ? (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">Thông tin sinh viên đăng ký:</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-700" />
                            <span className="text-muted-foreground">MSSV:</span>
                            <span className="font-medium">{topic.student.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-700" />
                            <span className="text-muted-foreground">Tên:</span>
                            <span className="font-medium">{topic.student.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-700" />
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{topic.student.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-700" />
                            <span className="text-muted-foreground">Lớp:</span>
                            <span className="font-medium">{topic.student.class_code || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">⚠️ Chưa có sinh viên đăng ký đề tài này</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Mã ngành: {topic.major_code}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>
                          {topic.time_start &&
                            new Date(topic.time_start).toLocaleDateString(
                              "vi-VN"
                            )}{" "}
                          -{" "}
                          {topic.time_end &&
                            new Date(topic.time_end).toLocaleDateString(
                              "vi-VN"
                            )}
                        </span>
                      </div>
                    </div>

                    {topic.assignment_code && (
                      <Button variant="outline" size="sm" className="mb-4">
                        <Download className="w-4 h-4 mr-2" />
                        Tải đề cương
                      </Button>
                    )}

                    {selectedTopic?.id === topic.id && (
                      <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                        <Label htmlFor="feedback" className="mb-2 block">
                          Nhận xét / Lý do từ chối
                        </Label>
                        <Textarea
                          id="feedback"
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Nhập nhận xét hoặc lý do từ chối..."
                          className="mb-3"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(topic.id)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Phê duyệt
                          </Button>
                          <Button
                            onClick={() => handleReject(topic.id)}
                            disabled={actionLoading}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedTopic(null);
                              setFeedback("");
                            }}
                            variant="outline"
                            disabled={actionLoading}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTopic?.id !== topic.id && (
                    <Button
                      onClick={() => setSelectedTopic(topic)}
                      variant="outline"
                    >
                      Xem xét
                    </Button>
                  )}
                </div>
              </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 py-1">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
