CREATE OR REPLACE FUNCTION public.generate_detailed_sales_report(p_start_date date, p_end_date date)
RETURNS jsonb
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