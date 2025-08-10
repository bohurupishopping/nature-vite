import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Dashboard data helpers
export const getRecentOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(name, email),
      profiles(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return { data, error }
}

export const getCustomersWithDues = async () => {
  const { data, error } = await supabase
    .rpc('get_customers_with_due_amounts')

  return { data, error }
}

export const getLowStockItems = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lt('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })

  return { data, error }
}

export const getRecentMarketVisits = async () => {
  const { data, error } = await supabase
    .from('market_visits')
    .select(`
      *,
      profiles(first_name, last_name),
      customers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return { data, error }
}

// Reports helpers
export const getSalesReport = async (filters: {
  startDate?: string
  endDate?: string
  salesmanId?: string
}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      customers(name, email, phone),
      profiles(first_name, last_name)
    `)

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.salesmanId) {
    query = query.eq('salesman_id', filters.salesmanId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export const getPaymentsReport = async (filters: {
  startDate?: string
  endDate?: string
  customerId?: string
}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      customers(name, email)
    `)

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export const getInventoryReport = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory_logs(*)
    `)
    .order('name', { ascending: true })

  return { data, error }
}

// Detailed Sales Report using SQL function
export const getDetailedSalesReport = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .rpc('generate_detailed_sales_report', {
      p_start_date: startDate,
      p_end_date: endDate
    })

  return { data, error }
}

// Customer management helpers
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  return { data, error }
}

export const getCustomerById = async (id: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

export const createCustomer = async (customer: {
  name: string
  type?: string
  contact_person?: string
  phone_number?: string
  address?: string
  street_address?: string
  village_or_city?: string
  district?: string
  price_list_id?: string
}) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single()

  return { data, error }
}

export const updateCustomer = async (id: string, customer: {
  name?: string
  type?: string
  contact_person?: string
  phone_number?: string
  address?: string
  street_address?: string
  village_or_city?: string
  district?: string
  price_list_id?: string
}) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deleteCustomer = async (id: string) => {
  const { data, error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  return { data, error }
}

export const getPriceLists = async () => {
  const { data, error } = await supabase
    .from('price_lists')
    .select('*')
    .order('name', { ascending: true })

  return { data, error }
}

export const getCustomerOrders = async (customerId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(first_name, last_name),
      order_items(
        *,
        products(name, sku)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getCustomerPayments = async (customerId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      orders(order_number, total_amount)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Price Lists management helpers
export const createPriceList = async (priceList: {
  name: string
  description?: string
}) => {
  const { data, error } = await supabase
    .from('price_lists')
    .insert([priceList])
    .select()
    .single()

  return { data, error }
}

export const updatePriceList = async (id: string, priceList: {
  name?: string
  description?: string
}) => {
  const { data, error } = await supabase
    .from('price_lists')
    .update(priceList)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deletePriceList = async (id: string) => {
  const { data, error } = await supabase
    .from('price_lists')
    .delete()
    .eq('id', id)

  return { data, error }
}

// Product Prices management helpers
export const getProductPricesByPriceList = async (priceListId: string) => {
  const { data, error } = await supabase
    .from('product_prices')
    .select(`
      *,
      products(name, sku, image_url)
    `)
    .eq('price_list_id', priceListId)
    .order('products(name)', { ascending: true })

  return { data, error }
}

export const createProductPrice = async (productPrice: {
  price_list_id: string
  product_id: string
  price: number
}) => {
  const { data, error } = await supabase
    .from('product_prices')
    .insert([productPrice])
    .select()
    .single()

  return { data, error }
}

export const updateProductPrice = async (id: string, price: number) => {
  const { data, error } = await supabase
    .from('product_prices')
    .update({ price })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deleteProductPrice = async (id: string) => {
  const { data, error } = await supabase
    .from('product_prices')
    .delete()
    .eq('id', id)

  return { data, error }
}

export const getProductPriceByProductAndPriceList = async (productId: string, priceListId: string) => {
  const { data, error } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .eq('price_list_id', priceListId)
    .single()

  return { data, error }
}

// Products management helpers
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  return { data, error }
}

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

export const searchProducts = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
    .order('name', { ascending: true })

  return { data, error }
}

export const createProduct = async (product: {
  name: string
  description?: string
  price: number
  sku: string
  stock_quantity: number
  image_url?: string
}) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  return { data, error }
}

export const updateProduct = async (id: string, product: {
  name?: string
  description?: string
  price?: number
  sku?: string
  stock_quantity?: number
  image_url?: string
}) => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deleteProduct = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  return { data, error }
}

// Product sales history
export const getProductSalesHistory = async (productId: string) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      orders(
        id,
        order_number,
        created_at,
        customers(name)
      )
    `)
    .eq('product_id', productId)
    .order('orders(created_at)', { ascending: false })

  return { data, error }
}

// Product returns history
export const getProductReturnsHistory = async (productId: string) => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      customers(name)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  return { data, error }
}