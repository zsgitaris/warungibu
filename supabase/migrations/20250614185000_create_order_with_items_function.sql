
-- Create function to handle order creation with items in a transaction
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_user_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_delivery_address text,
    p_notes text,
    p_total_amount numeric,
    p_order_items jsonb
)
RETURNS TABLE(
    id uuid,
    order_number text,
    user_id uuid,
    customer_name text,
    customer_phone text,
    delivery_address text,
    notes text,
    total_amount numeric,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id uuid;
    order_item jsonb;
BEGIN
    -- Insert the order
    INSERT INTO public.orders (
        user_id,
        customer_name,
        customer_phone,
        delivery_address,
        notes,
        total_amount,
        status
    ) VALUES (
        p_user_id,
        p_customer_name,
        p_customer_phone,
        p_delivery_address,
        p_notes,
        p_total_amount,
        'pending'
    )
    RETURNING orders.id INTO new_order_id;

    -- Insert order items
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            menu_item_id,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            new_order_id,
            (order_item->>'menu_item_id')::uuid,
            (order_item->>'quantity')::integer,
            (order_item->>'unit_price')::numeric,
            (order_item->>'subtotal')::numeric
        );
    END LOOP;

    -- Return the created order
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.user_id,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        o.notes,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at
    FROM public.orders o
    WHERE o.id = new_order_id;
END;
$$;
