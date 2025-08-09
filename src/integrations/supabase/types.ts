export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role_id: string
          created_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          role_id?: string
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          stock_quantity: number
          unit: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          stock_quantity: number
          unit: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          stock_quantity?: number
          unit?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          salesman_id: string
          total_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          salesman_id: string
          total_amount: number
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          salesman_id?: string
          total_amount?: number
          status?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          customer_id: string
          order_id: string | null
          amount: number
          payment_method: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          order_id?: string | null
          amount: number
          payment_method: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          order_id?: string | null
          amount?: number
          payment_method?: string
          status?: string
          created_at?: string
        }
      }
      market_visits: {
        Row: {
          id: string
          salesman_id: string
          customer_id: string
          visit_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          salesman_id: string
          customer_id: string
          visit_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          salesman_id?: string
          customer_id?: string
          visit_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      inventory_logs: {
        Row: {
          id: string
          product_id: string
          change_type: string
          quantity_changed: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_type: string
          quantity_changed: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          change_type?: string
          quantity_changed?: number
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_customers_with_due_amounts: {
        Args: {}
        Returns: {
          customer_id: string
          customer_name: string
          total_due: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}