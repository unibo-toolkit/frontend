export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface Classroom {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
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
  credits: number
  teams_link: string | null
  notes: string | null
  group_id: string | null
  classroom: Classroom | null
}

export interface PreviewResponse {
  items: TimetableEvent[]
  from_date: string
  to_date: string
  total: number
  courses_events_count: number
  target: TimetableEvent | null
}

export interface TimetableResponse {
  items: TimetableEvent[]
  total: number
}
