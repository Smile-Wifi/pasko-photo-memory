ALTER TABLE public.orders ADD COLUMN template text NOT NULL DEFAULT 'santa';
ALTER TABLE public.orders ADD CONSTRAINT orders_template_valid CHECK (template IN ('santa', 'family', 'winter', 'lights', 'fashion'));
COMMENT ON COLUMN public.orders.template IS 'Customer-selected featured Christmas template; each order includes all five Christmas styles.';