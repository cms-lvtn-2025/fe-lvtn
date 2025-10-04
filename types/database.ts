export enum RoleEnum {
  ACADEMIC_AFFAIRS_STAFF = "Academic_affairs_staff",
  SUPERVISOR_LECTURER = "Supervisor_lecturer",
  DEPARTMENT_LECTURER = "Department_Lecturer",
  REVIEWER_LECTURER = "Reviewer_Lecturer",
}

export interface Grade_defences extends BaseEntity {
  council?: number,
  secretary?: number
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum FileStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum MidtermStatus {
  NOT_SUBMITTED = "not_submitted",
  SUBMITTED = "submitted",
  GRADED = "graded",
}

export enum TopicStatus {
  PENDING = "pending",
  APPROVED = "approved",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export enum DefensePosition {
  PRESIDENT = "president",
  SECRETARY = "secretary",
  REVIEWER = "reviewer",
  MEMBER = "member",
}

export enum FinalStatus {
  PENDING = "pending",
  PASSED = "passed",
  FAILED = "failed",
  COMPLETED = "completed"
}

// Base interface for common fields
export interface BaseEntity {
  id: string
  created_at: Date
  updated_at: Date
  created_by?: string
  updated_by?: string
}

// Semesters
export interface Semester extends BaseEntity {
  title: string
}

// Students
export interface Student extends BaseEntity {
  email: string
  phone?: string
  username: string
  gender?: Gender
  major_code?: string
  class_code?: string
  semester_code?: string
}

// Teachers
export interface Teacher extends BaseEntity {
  email: string
  username: string
  gender?: Gender
  major_code?: string
  semester_code?: string
}

// Faculties
export interface Faculty extends BaseEntity {
  title: string
}

// Majors
export interface Major extends BaseEntity {
  title: string
  faculty_code: string
}

// Role Systems
export interface RoleSystem extends BaseEntity {
  title: string
  teacher_code: string
  role: RoleEnum
  semester_code: string
  activate: boolean
}

// Files
export interface File extends BaseEntity {
  title: string
  file: string // URL or path to file
  status: FileStatus
}

// Midterms
export interface Midterm extends BaseEntity {
  title: string
  grade?: number
  status: MidtermStatus
  feedback?: string
  file_submit?: string
}

// Enrollments
export interface Enrollment extends BaseEntity {
  title: string
  student_code: string
  midterm_code?: string
  final_code?: string
  grade_code?: string
}

// Topics
export interface Topic extends BaseEntity {
  title: string
  major_code: string
  assignment_code?: string
  enrollment_code?: string
  semester_code: string
  teacher_supervisor_code?: string
  status: TopicStatus
  time_start?: Date
  time_end?: Date
}

// Councils
export interface Council extends BaseEntity {
  title: string
  major_code: string
  topic_code: string
  time_start?: Date
  time_end?: Date
}

// Defences
export interface Defence {
  id: string
  title: string
  council_code: string
  teacher_code: string
  position: DefensePosition
}

// Finals
export interface Final extends BaseEntity {
  title: string
  file_code?: string
  supervisor_grade?: number
  reviewer_grade?: number
  defense_grade?: number
  final_grade?: number
  status: FinalStatus
  notes?: string
  completion_date?: Date
}

// Input types for creating new records (without id and timestamps)
export type CreateSemesterInput = Omit<Semester, "id" | "created_at" | "updated_at">
export type CreateStudentInput = Omit<Student, "id" | "created_at" | "updated_at">
export type CreateTeacherInput = Omit<Teacher, "id" | "created_at" | "updated_at">
export type CreateFacultyInput = Omit<Faculty, "id" | "created_at" | "updated_at">
export type CreateMajorInput = Omit<Major, "id" | "created_at" | "updated_at">
export type CreateRoleSystemInput = Omit<RoleSystem, "id" | "created_at" | "updated_at">
export type CreateFileInput = Omit<File, "id" | "created_at" | "updated_at">
export type CreateMidtermInput = Omit<Midterm, "id" | "created_at" | "updated_at">
export type CreateEnrollmentInput = Omit<Enrollment, "id" | "created_at" | "updated_at">
export type CreateTopicInput = Omit<Topic, "id" | "created_at" | "updated_at">
export type CreateCouncilInput = Omit<Council, "id" | "created_at" | "updated_at">
export type CreateDefenceInput = Omit<Defence, "id">
export type CreateFinalInput = Omit<Final, "id" | "created_at" | "updated_at">

// Update types (all fields optional except id)
export type UpdateSemesterInput = Partial<Omit<Semester, "id" | "created_at" | "updated_at">>
export type UpdateStudentInput = Partial<Omit<Student, "id" | "created_at" | "updated_at">>
export type UpdateTeacherInput = Partial<Omit<Teacher, "id" | "created_at" | "updated_at">>
export type UpdateFacultyInput = Partial<Omit<Faculty, "id" | "created_at" | "updated_at">>
export type UpdateMajorInput = Partial<Omit<Major, "id" | "created_at" | "updated_at">>
export type UpdateRoleSystemInput = Partial<Omit<RoleSystem, "id" | "created_at" | "updated_at">>
export type UpdateFileInput = Partial<Omit<File, "id" | "created_at" | "updated_at">>
export type UpdateMidtermInput = Partial<Omit<Midterm, "id" | "created_at" | "updated_at">>
export type UpdateEnrollmentInput = Partial<Omit<Enrollment, "id" | "created_at" | "updated_at">>
export type UpdateTopicInput = Partial<Omit<Topic, "id" | "created_at" | "updated_at">>
export type UpdateCouncilInput = Partial<Omit<Council, "id" | "created_at" | "updated_at">>
export type UpdateDefenceInput = Partial<Omit<Defence, "id">>
export type UpdateFinalInput = Partial<Omit<Final, "id" | "created_at" | "updated_at">>
