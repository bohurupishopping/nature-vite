--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: generate_detailed_sales_report(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_detailed_sales_report(p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    report_json jsonb;
BEGIN
    SELECT
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'order_number', q.order_number,
                    'order_date', q.order_date,
                    'order_status', q.order_status,
                    'customer_name', q.customer_name,
                    'salesman_name', q.salesman_name,
                    'product_name', q.product_name,
                    'product_sku', q.product_sku,
                    'quantity_sold', q.quantity_sold,
                    'unit_price', q.unit_price,
                    'line_item_total', q.line_item_total
                ) ORDER BY q.order_date ASC
            ),
            '[]'::jsonb
        )
    INTO report_json
    FROM (
        SELECT
            o.order_number,
            o.created_at AS order_date,
            o.status AS order_status,
            c.name AS customer_name,
            p.full_name AS salesman_name,
            pr.name AS product_name,
            pr.sku AS product_sku,
            oi.quantity AS quantity_sold,
            oi.unit_price,
            (oi.quantity * oi.unit_price) AS line_item_total
        FROM
            public.order_items oi
        JOIN
            public.orders o ON oi.order_id = o.id
        JOIN
            public.customers c ON o.customer_id = c.id
        JOIN
            public.products pr ON oi.product_id = pr.id
        LEFT JOIN
            public.profiles p ON o.salesman_id = p.id
        WHERE
            o.created_at::DATE >= p_start_date AND o.created_at::DATE <= p_end_date
    ) q;

    RETURN report_json;
END;
$$;


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 'NT/' || TO_CHAR(CURRENT_DATE, 'DD') || '/' || LPAD(nextval('public.order_number_seq')::TEXT, 4, '0');
END;
$$;


--
-- Name: get_business_report_data(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_business_report_data(salesman_id_param uuid, end_date_param date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Define the date ranges for current and previous periods (30 days)
    start_date_current date := end_date_param - interval '29 days';
    end_date_previous date := start_date_current - interval '1 day';
    start_date_previous date := end_date_previous - interval '29 days';
    
    report_data jsonb;
BEGIN
    WITH period_sales AS (
        -- CTE for all sales-related data
        SELECT
            id, total_amount, salesman_id, created_at
        FROM orders
        WHERE (salesman_id = salesman_id_param OR salesman_id_param IS NULL)
    ),
    period_visits AS (
        -- CTE for all visit-related data
        SELECT
            id, salesman_id, visit_date
        FROM market_visits
        WHERE (salesman_id = salesman_id_param OR salesman_id_param IS NULL)
    )
    SELECT jsonb_build_object(
        'report_context', jsonb_build_object(
            'report_scope', CASE WHEN salesman_id_param IS NULL THEN 'All Sales Team' ELSE (SELECT full_name FROM profiles WHERE id = salesman_id_param) END,
            'period_end', end_date_param,
            'period_start', start_date_current
        ),
        'performance_summary', jsonb_build_object(
            'total_sales', jsonb_build_object(
                'current', (SELECT COALESCE(SUM(total_amount), 0) FROM period_sales WHERE created_at::date BETWEEN start_date_current AND end_date_param),
                'previous', (SELECT COALESCE(SUM(total_amount), 0) FROM period_sales WHERE created_at::date BETWEEN start_date_previous AND end_date_previous)
            ),
            'total_collections', jsonb_build_object(
                'current', (SELECT COALESCE(SUM(p.amount_received), 0) FROM payments p JOIN period_sales s ON p.order_id = s.id WHERE s.created_at::date BETWEEN start_date_current AND end_date_param),
                'previous', (SELECT COALESCE(SUM(p.amount_received), 0) FROM payments p JOIN period_sales s ON p.order_id = s.id WHERE s.created_at::date BETWEEN start_date_previous AND end_date_previous)
            ),
            'orders_created', jsonb_build_object(
                'current', (SELECT COUNT(id) FROM period_sales WHERE created_at::date BETWEEN start_date_current AND end_date_param),
                'previous', (SELECT COUNT(id) FROM period_sales WHERE created_at::date BETWEEN start_date_previous AND end_date_previous)
            ),
            'market_visits', jsonb_build_object(
                'current', (SELECT COUNT(id) FROM period_visits WHERE visit_date BETWEEN start_date_current AND end_date_param),
                'previous', (SELECT COUNT(id) FROM period_visits WHERE visit_date BETWEEN start_date_previous AND end_date_previous)
            )
        ),
        'salesman_breakdown', (
            SELECT jsonb_agg(s_data) FROM (
                SELECT
                    p.full_name,
                    COALESCE(SUM(o.total_amount), 0) as total_sales,
                    (SELECT COALESCE(SUM(py.amount_received), 0) FROM payments py JOIN orders ord ON py.order_id = ord.id WHERE ord.salesman_id = p.id AND ord.created_at::date BETWEEN start_date_current AND end_date_param) as total_collections,
                    COUNT(DISTINCT o.id) as total_orders,
                    (SELECT COUNT(id) FROM period_visits pv WHERE pv.salesman_id = p.id AND pv.visit_date BETWEEN start_date_current AND end_date_param) as total_visits,
                    CASE 
                        WHEN (SELECT COUNT(id) FROM period_visits pv WHERE pv.salesman_id = p.id AND pv.visit_date BETWEEN start_date_current AND end_date_param) > 0 
                        THEN ROUND((COUNT(DISTINCT o.id)::numeric / (SELECT COUNT(id) FROM period_visits pv WHERE pv.salesman_id = p.id AND pv.visit_date BETWEEN start_date_current AND end_date_param)::numeric) * 100, 2)
                        ELSE 0 
                    END as visit_to_order_ratio_percent
                FROM profiles p
                LEFT JOIN orders o ON p.id = o.salesman_id AND o.created_at::date BETWEEN start_date_current AND end_date_param
                WHERE (p.id = salesman_id_param OR salesman_id_param IS NULL) AND p.role_id != 1 -- Assuming role_id 1 is Admin, excluding them from salesman list
                GROUP BY p.id
                HAVING COALESCE(SUM(o.total_amount), 0) > 0 OR (SELECT COUNT(id) FROM period_visits pv WHERE pv.salesman_id = p.id AND pv.visit_date BETWEEN start_date_current AND end_date_param) > 0
            ) s_data
        ),
        'product_insights', jsonb_build_object(
            'top_sellers', (
                SELECT jsonb_agg(p_data) FROM (
                    SELECT pr.name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.unit_price) as revenue
                    FROM order_items oi
                    JOIN products pr ON oi.product_id = pr.id
                    JOIN orders o ON oi.order_id = o.id
                    WHERE o.created_at::date BETWEEN start_date_current AND end_date_param AND (o.salesman_id = salesman_id_param OR salesman_id_param IS NULL)
                    GROUP BY pr.name ORDER BY quantity DESC LIMIT 5
                ) p_data
            ),
            'low_stock_warnings', (
                SELECT jsonb_agg(jsonb_build_object('name', name, 'stock', stock_quantity))
                FROM products WHERE stock_quantity < 20 ORDER BY stock_quantity ASC LIMIT 5
            ),
             'high_return_rate', (
                SELECT jsonb_agg(r_data) FROM (
                    SELECT pr.name, COUNT(r.id) as return_count
                    FROM returns r
                    JOIN order_items oi ON r.order_item_id = oi.id
                    JOIN products pr ON oi.product_id = pr.id
                    WHERE r.created_at::date BETWEEN start_date_current AND end_date_param AND r.status = 'Processed'
                    GROUP BY pr.name HAVING COUNT(r.id) > 0 ORDER BY return_count DESC LIMIT 5
                ) r_data
            )
        ),
        'visit_report_themes', (
             SELECT jsonb_agg(json_build_object('salesman', p.full_name, 'report', mv.report))
             FROM market_visits mv
             JOIN profiles p ON mv.salesman_id = p.id
             WHERE mv.visit_date BETWEEN start_date_current AND end_date_param AND (mv.salesman_id = salesman_id_param OR salesman_id_param IS NULL) AND mv.report IS NOT NULL
             LIMIT 10
        ),
        'customer_dues', (
            SELECT jsonb_agg(c_data) FROM (
                SELECT name, due_amount FROM public.get_customers_with_due_amounts() WHERE due_amount > 0 ORDER BY due_amount DESC LIMIT 5
            ) c_data
        )
    ) INTO report_data;
    
    RETURN report_data;
END;
$$;


--
-- Name: get_customers_with_due_amounts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_customers_with_due_amounts() RETURNS TABLE(customer_id uuid, customer_name text, contact_person text, phone_number text, address text, customer_type text, total_sales numeric, total_paid numeric, due_amount numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.contact_person,
    c.phone_number,
    c.address,
    c.type,
    -- Calculate total sales for the customer
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id), 0) as total_sales,
    -- Calculate total payments received for the customer
    COALESCE((
      SELECT SUM(p.amount_received)
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.customer_id = c.id
    ), 0) as total_paid,
    -- Calculate due amount (total sales - total payments)
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id), 0) -
    COALESCE((
      SELECT SUM(p.amount_received)
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.customer_id = c.id
    ), 0) as due_amount
  FROM
    customers c
  ORDER BY
    c.name;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, role_id, full_name)
  VALUES (
    NEW.id,
    3, -- Sets the default role to 'User' (ID 3) as requested.
    NEW.raw_user_meta_data->>'full_name' -- Optionally fetches the full name from signup metadata.
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_cancellation_inventory_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_cancellation_inventory_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    item RECORD;
BEGIN
    -- This trigger should only run if the status is updated TO 'Cancelled'.
    IF OLD.status <> 'Cancelled' AND NEW.status = 'Cancelled' THEN
        -- Loop through each item associated with the cancelled order.
        FOR item IN
            SELECT * FROM public.order_items WHERE order_id = NEW.id
        LOOP
            -- Increase the stock quantity for the returned product.
            UPDATE public.products
            SET stock_quantity = stock_quantity + item.quantity
            WHERE id = item.product_id;

            -- Create a log entry for the cancellation.
            INSERT INTO public.inventory_logs (product_id, quantity_change, reason, related_order_id)
            VALUES (item.product_id, item.quantity, 'Order Cancellation', NEW.id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: log_return_inventory_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_return_inventory_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_product_id UUID;
    v_order_id UUID;
BEGIN
    -- This trigger should only run if the return status is updated TO 'Processed'.
    IF OLD.status <> 'Processed' AND NEW.status = 'Processed' THEN
        -- Get the product_id and order_id from the related order_item.
        SELECT product_id, order_id INTO v_product_id, v_order_id
        FROM public.order_items
        WHERE id = NEW.order_item_id;

        -- Increase the stock quantity for the returned product.
        UPDATE public.products
        SET stock_quantity = stock_quantity + NEW.quantity_returned
        WHERE id = v_product_id;

        -- Create a log entry for the customer return.
        INSERT INTO public.inventory_logs (product_id, quantity_change, reason, related_order_id)
        VALUES (v_product_id, NEW.quantity_returned, 'Customer Return', v_order_id);
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: log_sale_inventory_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_sale_inventory_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Decrease the stock quantity for the sold product.
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;

    -- Create a log entry to record the reason for the stock change.
    INSERT INTO public.inventory_logs (product_id, quantity_change, reason, related_order_id)
    VALUES (NEW.product_id, -NEW.quantity, 'Sale', NEW.order_id);

    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_name character varying(50) NOT NULL,
    api_key text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    type text,
    contact_person text,
    phone_number text,
    address text,
    price_list_id uuid,
    street_address text,
    village_or_city text,
    district text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    CONSTRAINT customers_type_check CHECK ((type = ANY (ARRAY['Credit'::text, 'Cash'::text])))
);


--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    product_id uuid NOT NULL,
    quantity_change integer NOT NULL,
    reason text NOT NULL,
    related_order_id uuid,
    notes text,
    CONSTRAINT chk_quantity_not_zero CHECK ((quantity_change <> 0))
);


--
-- Name: market_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    salesman_id uuid NOT NULL,
    visit_date date NOT NULL,
    report text NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    next_visit_date date,
    photo_url text,
    customer_id uuid,
    visit_type text,
    new_contact_name text,
    new_contact_phone text,
    CONSTRAINT market_visits_visit_type_check CHECK ((visit_type = ANY (ARRAY['Existing Customer'::text, 'New Prospect'::text])))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    salesman_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    status text DEFAULT 'Pending'::text NOT NULL,
    order_notes text,
    order_number text DEFAULT public.generate_order_number() NOT NULL,
    order_type text DEFAULT 'Standard'::text,
    due_date date,
    tax_amount numeric(10,2) DEFAULT 0,
    shipping_costs numeric(10,2) DEFAULT 0,
    is_fully_paid boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_order_type CHECK ((order_type = ANY (ARRAY['Standard'::text, 'Bulk'::text, 'Sample'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Completed'::text, 'Cancelled'::text, 'Processing'::text, 'Awaiting Payment'::text, 'Shipped'::text, 'Delivered'::text]))),
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id uuid NOT NULL,
    amount_received numeric(10,2) NOT NULL,
    status text NOT NULL,
    notes text,
    attachment_url text,
    payment_method text,
    received_by_salesman_id uuid,
    transaction_reference text,
    bank_name text,
    cheque_date date,
    clearing_date date,
    is_cleared boolean DEFAULT false NOT NULL,
    CONSTRAINT payments_amount_received_check CHECK ((amount_received >= (0)::numeric)),
    CONSTRAINT payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['Cash'::text, 'Cheque'::text, 'Mobile Money'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['Full'::text, 'Partial'::text, 'Not Received'::text])))
);


--
-- Name: price_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    price_list_id uuid NOT NULL,
    product_id uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT product_prices_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    sku text,
    image_url text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    avatar_url text,
    phone_number text,
    role_id integer
);


--
-- Name: returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.returns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_item_id uuid NOT NULL,
    quantity_returned integer NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'Requested'::text NOT NULL,
    notes text,
    CONSTRAINT chk_quantity_positive CHECK ((quantity_returned > 0)),
    CONSTRAINT chk_status CHECK ((status = ANY (ARRAY['Requested'::text, 'Approved'::text, 'Rejected'::text, 'Processed'::text])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sales_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_period_id uuid NOT NULL,
    target_type text NOT NULL,
    target_value_amount numeric(15,2),
    target_value_quantity integer,
    customer_id uuid,
    product_id uuid,
    salesman_id uuid,
    district text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_target_type CHECK ((target_type = ANY (ARRAY['Customer'::text, 'Product'::text, 'District'::text, 'Salesman'::text]))),
    CONSTRAINT chk_target_value CHECK (((target_value_amount IS NOT NULL) OR (target_value_quantity IS NOT NULL)))
);


--
-- Name: target_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.target_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT end_date_after_start_date CHECK ((end_date >= start_date))
);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_service_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_service_name_key UNIQUE (service_name);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: market_visits market_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_visits
    ADD CONSTRAINT market_visits_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: price_lists price_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_price_list_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_price_list_id_product_id_key UNIQUE (price_list_id, product_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_targets sales_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_pkey PRIMARY KEY (id);


--
-- Name: target_periods target_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_periods
    ADD CONSTRAINT target_periods_pkey PRIMARY KEY (id);


--
-- Name: order_items on_new_order_item; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_order_item AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.log_sale_inventory_change();


--
-- Name: orders on_order_cancellation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_order_cancellation AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_cancellation_inventory_change();


--
-- Name: returns on_return_processed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_return_processed AFTER UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.log_return_inventory_change();


--
-- Name: api_keys update_api_keys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: price_lists update_price_lists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_prices update_product_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON public.product_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: returns update_returns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sales_targets update_sales_targets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON public.sales_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: target_periods update_target_periods_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_target_periods_updated_at BEFORE UPDATE ON public.target_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers customers_price_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_price_list_id_fkey FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE SET NULL;


--
-- Name: inventory_logs inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory_logs inventory_logs_related_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: market_visits market_visits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_visits
    ADD CONSTRAINT market_visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: market_visits market_visits_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_visits
    ADD CONSTRAINT market_visits_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: orders orders_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_received_by_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_received_by_salesman_id_fkey FOREIGN KEY (received_by_salesman_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: product_prices product_prices_price_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_price_list_id_fkey FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: returns returns_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: sales_targets sales_targets_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: sales_targets sales_targets_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: sales_targets sales_targets_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sales_targets sales_targets_target_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_target_period_id_fkey FOREIGN KEY (target_period_id) REFERENCES public.target_periods(id) ON DELETE CASCADE;


--
-- Name: api_keys Authenticated users can insert api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert api_keys" ON public.api_keys FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: customers Authenticated users can manage customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage customers" ON public.customers USING ((auth.role() = 'authenticated'::text));


--
-- Name: market_visits Authenticated users can manage market visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage market visits" ON public.market_visits USING ((auth.role() = 'authenticated'::text));


--
-- Name: order_items Authenticated users can manage order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage order items" ON public.order_items USING ((auth.role() = 'authenticated'::text));


--
-- Name: orders Authenticated users can manage orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage orders" ON public.orders USING ((auth.role() = 'authenticated'::text));


--
-- Name: payments Authenticated users can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage payments" ON public.payments USING ((auth.role() = 'authenticated'::text));


--
-- Name: price_lists Authenticated users can manage price_lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage price_lists" ON public.price_lists USING ((auth.role() = 'authenticated'::text));


--
-- Name: product_prices Authenticated users can manage product_prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_prices" ON public.product_prices USING ((auth.role() = 'authenticated'::text));


--
-- Name: products Authenticated users can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage products" ON public.products USING ((auth.role() = 'authenticated'::text));


--
-- Name: profiles Authenticated users can manage profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage profiles" ON public.profiles USING ((auth.role() = 'authenticated'::text));


--
-- Name: sales_targets Authenticated users can manage sales_targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage sales_targets" ON public.sales_targets USING ((auth.role() = 'authenticated'::text));


--
-- Name: target_periods Authenticated users can manage target_periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage target_periods" ON public.target_periods USING ((auth.role() = 'authenticated'::text));


--
-- Name: api_keys Authenticated users can read api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read api_keys" ON public.api_keys FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: api_keys Authenticated users can update api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update api_keys" ON public.api_keys FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: roles Authenticated users can view roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view roles" ON public.roles FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: market_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: price_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: product_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_targets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

--
-- Name: target_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.target_periods ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

