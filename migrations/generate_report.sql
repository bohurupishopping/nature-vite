-- ====================================================================
--  SALES PERFORMANCE & TARGET ANALYSIS REPORTING FUNCTIONS
-- ====================================================================
--  Run this entire script once to create all the necessary
--  SQL functions for generating sales and target analysis reports.
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. REPORT: Sales vs. Target Achievement (Overall)
-- --------------------------------------------------------------------
-- DESCRIPTION: Compares overall sales against all targets for a specific period.
-- PARAMETERS:
--   p_target_period_id: The UUID of the target period to analyze.
-- USAGE EXAMPLE:
--   SELECT * FROM report_sales_vs_target_achievement('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_sales_vs_target_achievement(p_target_period_id uuid)
RETURNS TABLE(
    period_name text,
    start_date date,
    end_date date,
    target_amount numeric,
    actual_amount numeric,
    variance_amount numeric,
    target_quantity bigint,
    actual_quantity bigint,
    variance_quantity bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH TargetData AS (
      SELECT
        SUM(st.target_value_amount) AS total_target_amount,
        SUM(st.target_value_quantity) AS total_target_quantity
      FROM public.sales_targets st
      WHERE st.target_period_id = p_target_period_id
    ),
    SalesData AS (
      SELECT
        SUM(o.total_amount) AS total_sales_amount,
        SUM(oi.quantity) AS total_sales_quantity
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.target_periods tp ON o.created_at::date BETWEEN tp.start_date AND tp.end_date
      WHERE tp.id = p_target_period_id
    )
    SELECT
      tp.name AS period_name,
      tp.start_date,
      tp.end_date,
      COALESCE(td.total_target_amount, 0) AS target_amount,
      COALESCE(sd.total_sales_amount, 0) AS actual_amount,
      COALESCE(sd.total_sales_amount, 0) - COALESCE(td.total_target_amount, 0) AS variance_amount,
      COALESCE(td.total_target_quantity, 0)::bigint AS target_quantity,
      COALESCE(sd.total_sales_quantity, 0)::bigint AS actual_quantity,
      COALESCE(sd.total_sales_quantity, 0) - COALESCE(td.total_target_quantity, 0) AS variance_quantity
    FROM public.target_periods tp
    CROSS JOIN TargetData td
    CROSS JOIN SalesData sd
    WHERE tp.id = p_target_period_id;
END;
$$;


-- --------------------------------------------------------------------
-- 2. REPORT: Sales Performance by Salesman vs. Target
-- --------------------------------------------------------------------
-- DESCRIPTION: Analyzes each salesman's sales against their specific targets.
-- PARAMETERS:
--   p_target_period_id: The UUID of the target period.
-- USAGE EXAMPLE:
--   SELECT * FROM report_salesman_performance_vs_target('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_salesman_performance_vs_target(p_target_period_id uuid)
RETURNS TABLE(
    salesman_name text,
    target_amount numeric,
    actual_amount numeric,
    variance_amount numeric,
    target_quantity integer,
    actual_quantity bigint,
    variance_quantity bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH SalesmanSales AS (
      SELECT
        o.salesman_id,
        SUM(o.total_amount) AS actual_sales_amount,
        SUM(oi.quantity) AS actual_sales_quantity
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.target_periods tp ON o.created_at::date BETWEEN tp.start_date AND tp.end_date
      WHERE tp.id = p_target_period_id
      GROUP BY o.salesman_id
    )
    SELECT
      prof.full_name AS salesman_name,
      st.target_value_amount,
      COALESCE(ss.actual_sales_amount, 0) AS actual_amount,
      COALESCE(ss.actual_sales_amount, 0) - st.target_value_amount AS variance_amount,
      st.target_value_quantity,
      COALESCE(ss.actual_sales_quantity, 0) AS actual_quantity,
      COALESCE(ss.actual_sales_quantity, 0) - st.target_value_quantity AS variance_quantity
    FROM public.sales_targets st
    JOIN public.profiles prof ON st.salesman_id = prof.id
    LEFT JOIN SalesmanSales ss ON st.salesman_id = ss.salesman_id
    WHERE st.target_period_id = p_target_period_id
      AND st.target_type = 'Salesman';
END;
$$;


-- --------------------------------------------------------------------
-- 3. REPORT: Sales Performance by Product vs. Target
-- --------------------------------------------------------------------
-- DESCRIPTION: Compares each product's sales performance against its target.
-- PARAMETERS:
--   p_target_period_id: The UUID of the target period.
-- USAGE EXAMPLE:
--   SELECT * FROM report_product_performance_vs_target('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_product_performance_vs_target(p_target_period_id uuid)
RETURNS TABLE(
    product_name text,
    target_amount numeric,
    actual_amount numeric,
    variance_amount numeric,
    target_quantity integer,
    actual_quantity bigint,
    variance_quantity bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH ProductSales AS (
      SELECT
        oi.product_id,
        SUM(oi.quantity * oi.unit_price) AS actual_sales_amount,
        SUM(oi.quantity) AS actual_sales_quantity
      FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      JOIN public.target_periods tp ON o.created_at::date BETWEEN tp.start_date AND tp.end_date
      WHERE tp.id = p_target_period_id
      GROUP BY oi.product_id
    )
    SELECT
      p.name AS product_name,
      st.target_value_amount,
      COALESCE(ps.actual_sales_amount, 0) AS actual_amount,
      COALESCE(ps.actual_sales_amount, 0) - st.target_value_amount AS variance_amount,
      st.target_value_quantity,
      COALESCE(ps.actual_sales_quantity, 0) AS actual_quantity,
      COALESCE(ps.actual_sales_quantity, 0) - st.target_value_quantity AS variance_quantity
    FROM public.sales_targets st
    JOIN public.products p ON st.product_id = p.id
    LEFT JOIN ProductSales ps ON st.product_id = ps.product_id
    WHERE st.target_period_id = p_target_period_id
      AND st.target_type = 'Product';
END;
$$;

-- --------------------------------------------------------------------
-- 4. REPORT: Sales Performance by Customer vs. Target
-- --------------------------------------------------------------------
-- DESCRIPTION: Compares a customer's sales performance against their target.
-- PARAMETERS:
--   p_target_period_id: The UUID of the target period.
-- USAGE EXAMPLE:
--   SELECT * FROM report_customer_performance_vs_target('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_customer_performance_vs_target(p_target_period_id uuid)
RETURNS TABLE(
    customer_name text,
    target_amount numeric,
    actual_amount numeric,
    variance_amount numeric,
    target_quantity integer,
    actual_quantity bigint,
    variance_quantity bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH CustomerSales AS (
      SELECT
        o.customer_id,
        SUM(o.total_amount) AS actual_sales_amount,
        SUM(oi.quantity) AS actual_sales_quantity
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.target_periods tp ON o.created_at::date BETWEEN tp.start_date AND tp.end_date
      WHERE tp.id = p_target_period_id
      GROUP BY o.customer_id
    )
    SELECT
      c.name AS customer_name,
      st.target_value_amount,
      COALESCE(cs.actual_sales_amount, 0) AS actual_amount,
      COALESCE(cs.actual_sales_amount, 0) - st.target_value_amount AS variance_amount,
      st.target_value_quantity,
      COALESCE(cs.actual_sales_quantity, 0) AS actual_quantity,
      COALESCE(cs.actual_sales_quantity, 0) - st.target_value_quantity AS variance_quantity
    FROM public.sales_targets st
    JOIN public.customers c ON st.customer_id = c.id
    LEFT JOIN CustomerSales cs ON st.customer_id = cs.customer_id
    WHERE st.target_period_id = p_target_period_id
      AND st.target_type = 'Customer';
END;
$$;


-- --------------------------------------------------------------------
-- 5. REPORT: Sales Performance by District vs. Target
-- --------------------------------------------------------------------
-- DESCRIPTION: Measures sales in a geographical district against set targets.
-- PARAMETERS:
--   p_target_period_id: The UUID of the target period.
-- USAGE EXAMPLE:
--   SELECT * FROM report_district_performance_vs_target('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_district_performance_vs_target(p_target_period_id uuid)
RETURNS TABLE(
    district text,
    target_amount numeric,
    actual_amount numeric,
    variance_amount numeric,
    target_quantity integer,
    actual_quantity bigint,
    variance_quantity bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH DistrictSales AS (
      SELECT
        c.district,
        SUM(o.total_amount) AS actual_sales_amount,
        SUM(oi.quantity) AS actual_sales_quantity
      FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.target_periods tp ON o.created_at::date BETWEEN tp.start_date AND tp.end_date
      WHERE tp.id = p_target_period_id AND c.district IS NOT NULL
      GROUP BY c.district
    )
    SELECT
      st.district,
      st.target_value_amount,
      COALESCE(ds.actual_sales_amount, 0) AS actual_amount,
      COALESCE(ds.actual_sales_amount, 0) - st.target_value_amount AS variance_amount,
      st.target_value_quantity,
      COALESCE(ds.actual_sales_quantity, 0) AS actual_quantity,
      COALESCE(ds.actual_sales_quantity, 0) - st.target_value_quantity AS variance_quantity
    FROM public.sales_targets st
    LEFT JOIN DistrictSales ds ON st.district = ds.district
    WHERE st.target_period_id = p_target_period_id
      AND st.target_type = 'District';
END;
$$;


-- --------------------------------------------------------------------
-- 6. REPORT: Overall Sales Trend (Daily, Weekly, Monthly)
-- --------------------------------------------------------------------
-- DESCRIPTION: Shows total sales aggregated over different time intervals.
-- PARAMETERS:
--   p_start_date: The start of the date range.
--   p_end_date: The end of the date range.
-- USAGE EXAMPLES:
--   SELECT * FROM report_sales_trend_daily('2025-01-01', '2025-01-31');
--   SELECT * FROM report_sales_trend_weekly('2025-01-01', '2025-03-31');
--   SELECT * FROM report_sales_trend_monthly('2025-01-01', '2025-12-31');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_sales_trend_daily(p_start_date date, p_end_date date)
RETURNS TABLE(sales_date date, total_sales numeric, number_of_orders bigint)
LANGUAGE sql STABLE AS $$
  SELECT DATE(created_at), SUM(total_amount), COUNT(id)
  FROM public.orders
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(created_at) ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.report_sales_trend_weekly(p_start_date date, p_end_date date)
RETURNS TABLE(week_start_date date, total_sales numeric, number_of_orders bigint)
LANGUAGE sql STABLE AS $$
  SELECT DATE_TRUNC('week', created_at)::date, SUM(total_amount), COUNT(id)
  FROM public.orders
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY 1 ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.report_sales_trend_monthly(p_start_date date, p_end_date date)
RETURNS TABLE(month_start_date date, total_sales numeric, number_of_orders bigint)
LANGUAGE sql STABLE AS $$
  SELECT DATE_TRUNC('month', created_at)::date, SUM(total_amount), COUNT(id)
  FROM public.orders
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY 1 ORDER BY 1;
$$;


-- --------------------------------------------------------------------
-- 7. REPORT: Top Customers by Sales Value and Volume
-- --------------------------------------------------------------------
-- DESCRIPTION: Ranks customers based on their total purchases.
-- PARAMETERS:
--   p_start_date: The start of the date range.
--   p_end_date: The end of the date range.
--   p_limit: The number of top customers to return.
-- USAGE EXAMPLE:
--   SELECT * FROM report_top_customers('2025-01-01', '2025-12-31', 20);
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_top_customers(p_start_date date, p_end_date date, p_limit integer)
RETURNS TABLE(
    customer_name text,
    total_sales_value numeric,
    total_items_purchased bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
      c.name AS customer_name,
      SUM(o.total_amount) AS total_sales_value,
      SUM(oi.quantity)::bigint AS total_items_purchased
    FROM public.customers c
    JOIN public.orders o ON c.id = o.customer_id
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY c.id
    ORDER BY total_sales_value DESC
    LIMIT p_limit;
END;
$$;


-- --------------------------------------------------------------------
-- 8. REPORT: Customer Purchase History
-- --------------------------------------------------------------------
-- DESCRIPTION: Provides a detailed list of all items from all orders for a customer.
-- PARAMETERS:
--   p_customer_id: The UUID of the customer.
-- USAGE EXAMPLE:
--   SELECT * FROM report_customer_purchase_history('a1b2c3d4-...');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_customer_purchase_history(p_customer_id uuid)
RETURNS TABLE(
    order_date timestamp with time zone,
    order_number text,
    product_name text,
    quantity integer,
    unit_price numeric,
    item_total numeric,
    order_status text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
      o.created_at AS order_date,
      o.order_number,
      p.name AS product_name,
      oi.quantity,
      oi.unit_price,
      (oi.quantity * oi.unit_price) AS item_total,
      o.status AS order_status
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.customer_id = p_customer_id
    ORDER BY o.created_at DESC;
END;
$$;


-- --------------------------------------------------------------------
-- 9. REPORT: Customer Dues and Outstanding Balance Report
-- --------------------------------------------------------------------
-- DESCRIPTION: Uses the pre-built function to show all customers with a balance.
-- PARAMETERS: None.
-- USAGE EXAMPLE:
--   SELECT * FROM report_customer_dues_and_balances();
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_customer_dues_and_balances()
RETURNS TABLE(
    customer_id uuid,
    customer_name text,
    contact_person text,
    phone_number text,
    address text,
    customer_type text,
    total_sales numeric,
    total_paid numeric,
    due_amount numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.get_customers_with_due_amounts()
  WHERE due_amount > 0;
$$;


-- --------------------------------------------------------------------
-- 10. REPORT: New vs. Existing Customer Sales Analysis
-- --------------------------------------------------------------------
-- DESCRIPTION: Categorizes sales based on new or existing customers in a period.
-- PARAMETERS:
--   p_start_date: The start of the date range for analysis.
--   p_end_date: The end of the date range for analysis.
-- USAGE EXAMPLE:
--   SELECT * FROM report_new_vs_existing_customer_sales('2025-01-01', '2025-12-31');
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_new_vs_existing_customer_sales(p_start_date date, p_end_date date)
RETURNS TABLE(customer_category text, total_sales numeric)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH CustomerFirstOrder AS (
      SELECT
        o.customer_id,
        MIN(o.created_at) AS first_order_date
      FROM public.orders o
      GROUP BY o.customer_id
    )
    SELECT
      CASE
        WHEN cfo.first_order_date BETWEEN p_start_date AND p_end_date THEN 'New Customer Sales'
        ELSE 'Existing Customer Sales'
      END AS customer_category,
      SUM(o.total_amount) AS total_sales
    FROM public.orders o
    JOIN CustomerFirstOrder cfo ON o.customer_id = cfo.customer_id
    WHERE o.created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY customer_category;
END;
$$;

COMMIT;