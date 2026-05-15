-- SQL Server converted migration (auto-converted from Supabase/PostgreSQL).
-- Removed PostgreSQL-only constructs: RLS policies, plpgsql functions, Supabase auth hooks.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Add GST slab columns to tax_rates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.tax_rates') AND name = 'cgst')
BEGIN
    ALTER TABLE dbo.tax_rates 
    ADD 
        cgst DECIMAL(18,2) NOT NULL DEFAULT 0,
        sgst DECIMAL(18,2) NOT NULL DEFAULT 0,
        igst DECIMAL(18,2) NOT NULL DEFAULT 0,
        is_default BIT NOT NULL DEFAULT 0;
END
GO

-- Insert default GST slabs if table is empty or update existing records
IF NOT EXISTS (SELECT TOP 1 1 FROM dbo.tax_rates WHERE tax_type = 'GST')
BEGIN
    INSERT INTO dbo.tax_rates (name, rate, tax_type, cgst, sgst, igst, is_default, is_active, created_at, updated_at)
    SELECT 
        name, rate, tax_type, cgst, sgst, igst, is_default, is_active, GETDATE(), GETDATE()
    FROM (VALUES
        ('GST 0%',  0,  'GST', 0,    0,    0,   0, 1),
        ('GST 5%',  5,  'GST', 2.5,  2.5,  5,   0, 1),
        ('GST 12%', 12, 'GST', 6,    6,    12,  0, 1),
        ('GST 18%', 18, 'GST', 9,    9,    18,  1, 1),
        ('GST 28%', 28, 'GST', 14,   14,   28,  0, 1)
    ) AS v(name, rate, tax_type, cgst, sgst, igst, is_default, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.tax_rates t WHERE t.name = v.name);
END
ELSE
BEGIN
    -- Update existing GST records with slab values
    UPDATE dbo.tax_rates 
    SET 
        cgst = CASE 
            WHEN rate = 5 THEN 2.5
            WHEN rate = 12 THEN 6
            WHEN rate = 18 THEN 9
            WHEN rate = 28 THEN 14
            ELSE 0
        END,
        sgst = CASE 
            WHEN rate = 5 THEN 2.5
            WHEN rate = 12 THEN 6
            WHEN rate = 18 THEN 9
            WHEN rate = 28 THEN 14
            ELSE 0
        END,
        igst = rate,
        is_default = CASE WHEN rate = 18 THEN 1 ELSE 0 END,
        updated_at = GETDATE()
    WHERE tax_type = 'GST' AND rate IN (0, 5, 12, 18, 28);
END
GO

-- Verify the changes
PRINT 'GST slab columns added and data inserted successfully.';
SELECT name, rate, tax_type, cgst, sgst, igst, is_default FROM dbo.tax_rates WHERE tax_type = 'GST' ORDER BY rate;
GO-- SQL Server converted migration (auto-converted from Supabase/PostgreSQL).
-- Removed PostgreSQL-only constructs: RLS policies, plpgsql functions, Supabase auth hooks.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Add GST slab columns to tax_rates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.tax_rates') AND name = 'cgst')
BEGIN
    ALTER TABLE dbo.tax_rates 
    ADD 
        cgst DECIMAL(18,2) NOT NULL DEFAULT 0,
        sgst DECIMAL(18,2) NOT NULL DEFAULT 0,
        igst DECIMAL(18,2) NOT NULL DEFAULT 0,
        is_default BIT NOT NULL DEFAULT 0;
END
GO

-- Insert default GST slabs if table is empty or update existing records
IF NOT EXISTS (SELECT TOP 1 1 FROM dbo.tax_rates WHERE tax_type = 'GST')
BEGIN
    INSERT INTO dbo.tax_rates (name, rate, tax_type, cgst, sgst, igst, is_default, is_active, created_at, updated_at)
    SELECT 
        name, rate, tax_type, cgst, sgst, igst, is_default, is_active, GETDATE(), GETDATE()
    FROM (VALUES
        ('GST 0%',  0,  'GST', 0,    0,    0,   0, 1),
        ('GST 5%',  5,  'GST', 2.5,  2.5,  5,   0, 1),
        ('GST 12%', 12, 'GST', 6,    6,    12,  0, 1),
        ('GST 18%', 18, 'GST', 9,    9,    18,  1, 1),
        ('GST 28%', 28, 'GST', 14,   14,   28,  0, 1)
    ) AS v(name, rate, tax_type, cgst, sgst, igst, is_default, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.tax_rates t WHERE t.name = v.name);
END
ELSE
BEGIN
    -- Update existing GST records with slab values
    UPDATE dbo.tax_rates 
    SET 
        cgst = CASE 
            WHEN rate = 5 THEN 2.5
            WHEN rate = 12 THEN 6
            WHEN rate = 18 THEN 9
            WHEN rate = 28 THEN 14
            ELSE 0
        END,
        sgst = CASE 
            WHEN rate = 5 THEN 2.5
            WHEN rate = 12 THEN 6
            WHEN rate = 18 THEN 9
            WHEN rate = 28 THEN 14
            ELSE 0
        END,
        igst = rate,
        is_default = CASE WHEN rate = 18 THEN 1 ELSE 0 END,
        updated_at = GETDATE()
    WHERE tax_type = 'GST' AND rate IN (0, 5, 12, 18, 28);
END
GO

-- Verify the changes
PRINT 'GST slab columns added and data inserted successfully.';
SELECT name, rate, tax_type, cgst, sgst, igst, is_default FROM dbo.tax_rates WHERE tax_type = 'GST' ORDER BY rate;
GO
