export interface User {
  id: number
  email: string
  name: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export interface MeasuredBy {
  id: number
  name: string
}

export interface Rim {
  id: number
  manufacturer: string
  model: string
  iso_size: number | null
  erd: number
  drilling_offset: number
  outer_width: number | null
  inner_width: number | null
  height: number | null
  weight: number | null
  joint_type: string | null
  eyelet_type: string | null
  tire_type: string | null
  notes: string | null
  is_reference: boolean
  measured_by: MeasuredBy | null
  measured_at: string | null
  created_at: string
  updated_at: string | null
}

export interface Hub {
  id: number
  manufacturer: string
  model: string
  position: string | null
  oln: number | null
  axle_type: string | null
  brake_type: string | null
  drive_interface: string | null
  flange_diameter_left: number
  flange_diameter_right: number
  flange_offset_left: number
  flange_offset_right: number
  spoke_hole_diameter: number | null
  spoke_count: number | null
  spoke_interface: string | null
  weight: number | null
  internal_gearing: string | null
  generator_type: string | null
  notes: string | null
  is_reference: boolean
  measured_by: MeasuredBy | null
  measured_at: string | null
  created_at: string
  updated_at: string | null
}

export interface Build {
  id: number
  rim: Rim
  hub: Hub
  spoke_count: number
  cross_pattern_left: number
  cross_pattern_right: number
  spoke_length_left: number
  spoke_length_right: number
  tension_percent_left: number | null
  tension_percent_right: number | null
  bracing_angle_left: number | null
  bracing_angle_right: number | null
  wrap_angle_left: number | null
  wrap_angle_right: number | null
  total_angle_left: number | null
  total_angle_right: number | null
  theta_angle_left: number | null
  theta_angle_right: number | null
  customer_name: string | null
  customer_notes: string | null
  internal_notes: string | null
  created_by: MeasuredBy
  created_at: string
}

export interface SpokeResult {
  spoke_length_left: number
  spoke_length_right: number
  spoke_length_left_rounded: number
  spoke_length_right_rounded: number
  tension_percent_left: number
  tension_percent_right: number
  bracing_angle_left: number
  bracing_angle_right: number
  wrap_angle_left: number
  wrap_angle_right: number
  total_angle_left: number
  total_angle_right: number
  theta_angle_left: number
  theta_angle_right: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}
