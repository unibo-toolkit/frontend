export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface Classroom {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface TimetableEvent {
  id: string
  subject_id: string
  title: string
  start_datetime: string
  end_datetime: string
  is_remote: boolean
  professor: string | null
  module_code: string | null
  credits: number | null
  teams_link: string | null
  notes: string | null
  group_id: string | null
  family_hash: string
  weekday: number
  slot_start: string
  classroom: Classroom | null
  excluded: boolean
}

export interface PreviewResponse {
  items: TimetableEvent[]
  from_date: string | null
  to_date: string | null
  total: number
  courses_events_count: number
  target: TimetableEvent | null
  excluded_events_count: number
  excluded_families: ExcludedFamily[]
}

export interface ExcludedFamily {
  family_hash: string
  subject_id: string
  title: string
  group_id: string | null
  weekday: number
  slot_start: string
  events: number
  first_at: string
  last_at: string
}
