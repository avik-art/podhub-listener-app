export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                  string
          email:               string
          name:                string | null
          designation:         string | null
          country:             string | null
          country_flag:        string | null
          gender:              string | null
          age_range:           string | null
          avatar_id:           string | null
          profile_photo_url:   string | null
          is_admin:            boolean
          is_podcaster:        boolean
          is_guest:            boolean
          is_banned:           boolean
          onboarding_complete: boolean
          disclaimer_agreed:   boolean
          payout_method:       string | null
          payout_details:      string | null
          referral_code:       string | null
          referred_by:         string | null
          points:              number
          monthly_points:      number
          streak_days:         number
          last_listen_date:    string | null
          joined_at:           string
          updated_at:          string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      point_transactions: {
        Row: {
          id:         string
          user_id:    string
          amount:     number
          reason:     string
          metadata:   Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['point_transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['point_transactions']['Row']>
      }
      episode_listens: {
        Row: {
          id:             string
          user_id:        string
          episode_guid:   string
          show_id:        string
          listen_seconds: number
          points_awarded: boolean
          completed_at:   string | null
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['episode_listens']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['episode_listens']['Row']>
      }
      social_follows: {
        Row: {
          id:          string
          user_id:     string
          platform:    string
          verified:    boolean
          verified_at: string | null
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['social_follows']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['social_follows']['Row']>
      }
      referrals: {
        Row: {
          id:             string
          referrer_id:    string
          referred_email: string
          referred_id:    string | null
          status:         string
          points_awarded: boolean
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['referrals']['Row']>
      }
      review_submissions: {
        Row: {
          id:           string
          user_id:      string
          show_id:      string
          show_name:    string
          platform:     string
          status:       string
          submitted_at: string
          reviewed_at:  string | null
          reviewed_by:  string | null
        }
        Insert: Omit<Database['public']['Tables']['review_submissions']['Row'], 'id' | 'submitted_at'>
        Update: Partial<Database['public']['Tables']['review_submissions']['Row']>
      }
      forum_posts: {
        Row: {
          id:         string
          author_id:  string
          tag:        string
          title:      string
          body:       string
          likes:      number
          is_pinned:  boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['forum_posts']['Row'], 'id' | 'likes' | 'is_pinned' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['forum_posts']['Row']>
      }
      admin_updates: {
        Row: {
          id:         string
          author_id:  string
          title:      string
          body:       string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_updates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_updates']['Row']>
      }
      rss_cache: {
        Row: {
          show_id:    string
          data:       Json
          fetched_at: string
        }
        Insert: Database['public']['Tables']['rss_cache']['Row']
        Update: Partial<Database['public']['Tables']['rss_cache']['Row']>
      }
    }
    Views:   Record<string, never>
    Functions: Record<string, never>
    Enums:   Record<string, never>
  }
}

// Convenience type aliases
export type Profile        = Database['public']['Tables']['profiles']['Row']
export type PointTx        = Database['public']['Tables']['point_transactions']['Row']
export type EpisodeListen  = Database['public']['Tables']['episode_listens']['Row']
export type SocialFollow   = Database['public']['Tables']['social_follows']['Row']
export type Referral       = Database['public']['Tables']['referrals']['Row']
export type ReviewSub      = Database['public']['Tables']['review_submissions']['Row']
export type ForumPost      = Database['public']['Tables']['forum_posts']['Row']
export type AdminUpdate    = Database['public']['Tables']['admin_updates']['Row']
export type RSSCache       = Database['public']['Tables']['rss_cache']['Row']
