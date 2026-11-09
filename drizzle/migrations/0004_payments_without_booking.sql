ALTER TABLE public.payments ALTER COLUMN booking_date DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN booking_time DROP NOT NULL;
COMMENT ON COLUMN public.payments.booking_date IS 'DEPRECATED: manual payment has no booking';
COMMENT ON COLUMN public.payments.booking_time IS 'DEPRECATED: manual payment has no booking';
COMMENT ON COLUMN public.payments.persons IS 'DEPRECATED: manual payment has no booking';