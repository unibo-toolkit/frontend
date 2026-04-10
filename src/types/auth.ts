export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_login: string
  roles: string[]
}
