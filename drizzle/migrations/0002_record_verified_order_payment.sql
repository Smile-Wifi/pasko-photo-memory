ALTER TABLE public.orders ADD COLUMN payment_verified_at timestamptz;
UPDATE public.orders SET payment_verified_at = updated_at WHERE status IN ('payment_verified', 'processing', 'completed');
COMMENT ON COLUMN public.orders.payment_verified_at IS 'Admin payment verification record required before generation, including retries after failure.';