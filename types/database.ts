export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          phone: string | null
          stripe_customer_id: string | null
          stripe_account_id: string | null
          subscription_tier: string
          subscription_status: string
          flip_score_scans_used: number
          photo_scans_used: number
          trade_count: number
          trade_rating_avg: number | null
          email_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          subscription_tier?: string
          subscription_status?: string
          flip_score_scans_used?: number
          photo_scans_used?: number
          trade_count?: number
          trade_rating_avg?: number | null
          email_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          subscription_tier?: string
          subscription_status?: string
          flip_score_scans_used?: number
          photo_scans_used?: number
          trade_count?: number
          trade_rating_avg?: number | null
          email_verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      lego_sets: {
        Row: {
          id: number
          set_number: string
          name: string
          theme: string | null
          subtheme: string | null
          year_released: number | null
          retail_price: number | null
          piece_count: number | null
          image_url: string | null
          is_retired: boolean
          retirement_date: string | null
          bricklink_avg_price: number | null
          ebay_avg_price: number | null
          last_price_update: string | null
          flip_score: number | null
          flip_score_reasoning: string | null
          flip_score_updated_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          set_number: string
          name: string
          theme?: string | null
          subtheme?: string | null
          year_released?: number | null
          retail_price?: number | null
          piece_count?: number | null
          image_url?: string | null
          is_retired?: boolean
          retirement_date?: string | null
          bricklink_avg_price?: number | null
          ebay_avg_price?: number | null
          last_price_update?: string | null
          flip_score?: number | null
          flip_score_reasoning?: string | null
          flip_score_updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          set_number?: string
          name?: string
          theme?: string | null
          subtheme?: string | null
          year_released?: number | null
          retail_price?: number | null
          piece_count?: number | null
          image_url?: string | null
          is_retired?: boolean
          retirement_date?: string | null
          bricklink_avg_price?: number | null
          ebay_avg_price?: number | null
          last_price_update?: string | null
          flip_score?: number | null
          flip_score_reasoning?: string | null
          flip_score_updated_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          id: string
          user_id: string
          set_id: number
          condition: string
          quantity: number
          purchase_price: number | null
          purchase_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: number
          condition: string
          quantity?: number
          purchase_price?: number | null
          purchase_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: number
          condition?: string
          quantity?: number
          purchase_price?: number | null
          purchase_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          set_id: number
          title: string
          description: string | null
          price: number
          condition: string
          is_trade_ok: boolean
          trade_wants: string | null
          images: string[]
          status: string
          views: number
          location: string | null
          stripe_payment_intent_id: string | null
          buyer_id: string | null
          sold_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          set_id: number
          title: string
          description?: string | null
          price: number
          condition: string
          is_trade_ok?: boolean
          trade_wants?: string | null
          images?: string[]
          status?: string
          views?: number
          location?: string | null
          stripe_payment_intent_id?: string | null
          buyer_id?: string | null
          sold_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          set_id?: number
          title?: string
          description?: string | null
          price?: number
          condition?: string
          is_trade_ok?: boolean
          trade_wants?: string | null
          images?: string[]
          status?: string
          views?: number
          location?: string | null
          stripe_payment_intent_id?: string | null
          buyer_id?: string | null
          sold_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          listing_id: string | null
          sender_id: string
          recipient_id: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          sender_id: string
          recipient_id: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          sender_id?: string
          recipient_id?: string
          body?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      trade_messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      trade_offers: {
        Row: {
          id: string
          user_id: string
          have_set_ids: number[]
          want_set_ids: number[]
          notes: string | null
          status: string
          matched_with: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          have_set_ids: number[]
          want_set_ids: number[]
          notes?: string | null
          status?: string
          matched_with?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          have_set_ids?: number[]
          want_set_ids?: number[]
          notes?: string | null
          status?: string
          matched_with?: string | null
          created_at?: string
        }
        Relationships: []
      }
      trade_matches: {
        Row: {
          id: string
          offer_a_id: string
          offer_b_id: string
          user_a_id: string
          user_b_id: string
          match_score: number | null
          status: string
          user_a_accepted: boolean
          user_b_accepted: boolean
          fee_paid: boolean
          stripe_payment_intent_id: string | null
          user_a_photo_url: string | null
          user_b_photo_url: string | null
          user_a_trade_terms_accepted: boolean
          user_b_trade_terms_accepted: boolean
          user_a_ship_agreed: boolean
          user_b_ship_agreed: boolean
          user_a_tracking: string | null
          user_b_tracking: string | null
          completed_at: string | null
          dispute_filed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          offer_a_id: string
          offer_b_id: string
          user_a_id: string
          user_b_id: string
          match_score?: number | null
          status?: string
          user_a_accepted?: boolean
          user_b_accepted?: boolean
          fee_paid?: boolean
          stripe_payment_intent_id?: string | null
          user_a_photo_url?: string | null
          user_b_photo_url?: string | null
          user_a_trade_terms_accepted?: boolean
          user_b_trade_terms_accepted?: boolean
          user_a_ship_agreed?: boolean
          user_b_ship_agreed?: boolean
          user_a_tracking?: string | null
          user_b_tracking?: string | null
          completed_at?: string | null
          dispute_filed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          offer_a_id?: string
          offer_b_id?: string
          user_a_id?: string
          user_b_id?: string
          match_score?: number | null
          status?: string
          user_a_accepted?: boolean
          user_b_accepted?: boolean
          fee_paid?: boolean
          stripe_payment_intent_id?: string | null
          user_a_photo_url?: string | null
          user_b_photo_url?: string | null
          user_a_trade_terms_accepted?: boolean
          user_b_trade_terms_accepted?: boolean
          user_a_ship_agreed?: boolean
          user_b_ship_agreed?: boolean
          user_a_tracking?: string | null
          user_b_tracking?: string | null
          completed_at?: string | null
          dispute_filed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      trade_reviews: {
        Row: {
          id: string
          match_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          body: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          body?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          body?: string | null
          created_at?: string
        }
        Relationships: []
      }
      trade_disputes: {
        Row: {
          id: string
          match_id: string
          filed_by: string
          reason: string
          description: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          filed_by: string
          reason: string
          description: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          filed_by?: string
          reason?: string
          description?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      deal_watches: {
        Row: {
          id: string
          user_id: string
          set_ids: number[]
          max_price: number | null
          radius_miles: number
          zip_code: string | null
          notify_sms: boolean
          notify_email: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_ids?: number[]
          max_price?: number | null
          radius_miles?: number
          zip_code?: string | null
          notify_sms?: boolean
          notify_email?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_ids?: number[]
          max_price?: number | null
          radius_miles?: number
          zip_code?: string | null
          notify_sms?: boolean
          notify_email?: boolean
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      deals_found: {
        Row: {
          id: string
          set_id: number | null
          platform: string
          listing_url: string
          listed_price: number | null
          estimated_value: number | null
          roi_percent: number | null
          location: string | null
          zip_code: string | null
          raw_title: string | null
          raw_description: string | null
          image_url: string | null
          is_active: boolean
          found_at: string
        }
        Insert: {
          id?: string
          set_id?: number | null
          platform: string
          listing_url: string
          listed_price?: number | null
          estimated_value?: number | null
          roi_percent?: number | null
          location?: string | null
          zip_code?: string | null
          raw_title?: string | null
          raw_description?: string | null
          image_url?: string | null
          is_active?: boolean
          found_at?: string
        }
        Update: {
          id?: string
          set_id?: number | null
          platform?: string
          listing_url?: string
          listed_price?: number | null
          estimated_value?: number | null
          roi_percent?: number | null
          location?: string | null
          zip_code?: string | null
          raw_title?: string | null
          raw_description?: string | null
          image_url?: string | null
          is_active?: boolean
          found_at?: string
        }
        Relationships: []
      }
      deal_alerts_sent: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          sent_via: string
          sent_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          sent_via: string
          sent_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          sent_via?: string
          sent_at?: string
        }
        Relationships: []
      }
      flip_entries: {
        Row: {
          id: string
          user_id: string
          set_id: number
          bought_price: number
          sold_price: number
          bought_at: string | null
          sold_at: string | null
          found_where: string | null
          proof_image_url: string | null
          notes: string | null
          roi_percent: number
          profit_dollars: number
          is_verified: boolean
          upvotes: number
          week_number: number | null
          year: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: number
          bought_price: number
          sold_price: number
          bought_at?: string | null
          sold_at?: string | null
          found_where?: string | null
          proof_image_url?: string | null
          notes?: string | null
          is_verified?: boolean
          upvotes?: number
          week_number?: number | null
          year?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: number
          bought_price?: number
          sold_price?: number
          bought_at?: string | null
          sold_at?: string | null
          found_where?: string | null
          proof_image_url?: string | null
          notes?: string | null
          is_verified?: boolean
          upvotes?: number
          week_number?: number | null
          year?: number | null
          created_at?: string
        }
        Relationships: []
      }
      weekly_champions: {
        Row: {
          id: string
          flip_entry_id: string
          user_id: string
          week_number: number
          year: number
          roi_percent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          flip_entry_id: string
          user_id: string
          week_number: number
          year: number
          roi_percent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          flip_entry_id?: string
          user_id?: string
          week_number?: number
          year?: number
          roi_percent?: number | null
          created_at?: string
        }
        Relationships: []
      }
      budget_plans: {
        Row: {
          id: string
          user_id: string
          budget_amount: number
          goal: string
          timeline_months: number | null
          risk_tolerance: string | null
          theme_preference: string | null
          ai_plan: Json
          projected_return: number | null
          projected_roi_percent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_amount: number
          goal: string
          timeline_months?: number | null
          risk_tolerance?: string | null
          theme_preference?: string | null
          ai_plan?: Json
          projected_return?: number | null
          projected_roi_percent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_amount?: number
          goal?: string
          timeline_months?: number | null
          risk_tolerance?: string | null
          theme_preference?: string | null
          ai_plan?: Json
          projected_return?: number | null
          projected_roi_percent?: number | null
          created_at?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          set_id: number
          target_price: number
          alert_when: string
          is_triggered: boolean
          triggered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: number
          target_price: number
          alert_when?: string
          is_triggered?: boolean
          triggered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: number
          target_price?: number
          alert_when?: string
          is_triggered?: boolean
          triggered_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      flip_upvotes: {
        Row: {
          id: string
          flip_entry_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          flip_entry_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          flip_entry_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type LegoSet = Database['public']['Tables']['lego_sets']['Row']
export type PortfolioItem = Database['public']['Tables']['portfolio_items']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type TradeOffer = Database['public']['Tables']['trade_offers']['Row']
export type TradeMatch = Database['public']['Tables']['trade_matches']['Row']
export type DealWatch = Database['public']['Tables']['deal_watches']['Row']
export type DealFound = Database['public']['Tables']['deals_found']['Row']
export type FlipEntry = Database['public']['Tables']['flip_entries']['Row']
export type BudgetPlan = Database['public']['Tables']['budget_plans']['Row']
export type PriceAlert = Database['public']['Tables']['price_alerts']['Row']
