export interface Curriculum {
  id: string
  code: string
  academic_year: number
  label: string
  is_active: boolean
  timetable_hash: string
  timetable_updated_at: string
  course?: {
    id: string
    title_it: string
    title_en: string
  }
}

export interface Course {
  id: string
  unibo_id: number
  title: string
  course_type: string
  campus: string
  languages: string[]
  duration_years: number
  url: string
  area: string
  curricula: Curriculum[]
}

export interface Subject {
  id: string
  curriculum_id: string
  title: string
  module_code: string
  group_id: string | null
  credits: number
  professor: string | null
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface CalendarCourse {
  id: string
  curriculum: Curriculum & { course: { id: string; title_it: string; title_en: string } }
  subjects: {
    id: string
    title: string
    module_code: string
    credits: number
    professor: string | null
  }[]
}

export interface Calendar {
  id: string
  slug: string
  name: string
  ics_url: string
  ttl_expires_at: string
  owner_id: string | null
  courses: CalendarCourse[]
  created_at: string
}

export interface CalendarListItem {
  id: string
  slug: string
  name: string
  ics_url: string
  access_count: number
  last_accessed_at: string | null
  ttl_expires_at: string | null
  courses_count: number
  created_at: string
}

export interface PublicCalendar {
  id: string
  name: string
  slug: string
  lang: string
  claimed: boolean
  courses: CalendarCourse[]
  total_events: number
  ttl_expires_at: string
  created_at: string
}

export interface CreateCalendarRequest {
  name: string
  lang: string
  courses: {
    curriculum_id: string
    subject_ids: string[]
  }[]
}
