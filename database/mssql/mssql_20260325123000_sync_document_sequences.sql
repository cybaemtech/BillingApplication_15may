SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Syncing document_sequences with existing MSSQL document numbers...';
GO

INSERT INTO dbo.document_sequences (document_type, prefix, next_number, padding)
SELECT * FROM (VALUES
    ('quotation', 'QT-', 1, 4),
    ('sales_order', 'SO-', 1, 4),
    ('delivery_challan', 'DC-', 1, 4),
    ('invoice', 'INV-', 1, 4),
    ('credit_note', 'CN-', 1, 4),
    ('purchase_order', 'PO-', 1, 4),
    ('bill', 'BILL-', 1, 4),
    ('vendor_credit', 'VC-', 1, 4),
    ('sales_return', 'SR-', 1, 4),
    ('purchase_return', 'PRTN-', 1, 4),
    ('payment_received', 'PR-', 1, 4),
    ('payment_made', 'PM-', 1, 4),
    ('journal_entry', 'JE-', 1, 4),
    ('expense', 'EXP-', 1, 4),
    ('pos_order', 'POS-', 1, 4)
) AS data(document_type, prefix, next_number, padding)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.document_sequences ds
    WHERE ds.document_type = data.document_type
);
GO

;WITH values_to_sync AS (
    SELECT 'quotation' AS document_type, MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1 AS next_number
    FROM dbo.quotations
    WHERE document_number LIKE 'QT-%'
    UNION ALL
    SELECT 'sales_order', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.sales_orders
    WHERE document_number LIKE 'SO-%'
    UNION ALL
    SELECT 'delivery_challan', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.delivery_challans
    WHERE document_number LIKE 'DC-%'
    UNION ALL
    SELECT 'invoice', MAX(TRY_CAST(SUBSTRING(document_number, 5, 50) AS INT)) + 1
    FROM dbo.invoices
    WHERE document_number LIKE 'INV-%'
    UNION ALL
    SELECT 'credit_note', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.credit_notes
    WHERE document_number LIKE 'CN-%'
    UNION ALL
    SELECT 'purchase_order', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.purchase_orders
    WHERE document_number LIKE 'PO-%'
    UNION ALL
    SELECT 'bill', MAX(TRY_CAST(SUBSTRING(document_number, 6, 50) AS INT)) + 1
    FROM dbo.bills
    WHERE document_number LIKE 'BILL-%'
    UNION ALL
    SELECT 'vendor_credit', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.vendor_credits
    WHERE document_number LIKE 'VC-%'
    UNION ALL
    SELECT 'sales_return', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.sales_returns
    WHERE document_number LIKE 'SR-%'
    UNION ALL
    SELECT 'purchase_return', MAX(TRY_CAST(SUBSTRING(document_number, 6, 50) AS INT)) + 1
    FROM dbo.purchase_returns
    WHERE document_number LIKE 'PRTN-%'
    UNION ALL
    SELECT 'payment_received', MAX(TRY_CAST(SUBSTRING(payment_number, 4, 50) AS INT)) + 1
    FROM dbo.payments_received
    WHERE payment_number LIKE 'PR-%'
    UNION ALL
    SELECT 'payment_made', MAX(TRY_CAST(SUBSTRING(payment_number, 4, 50) AS INT)) + 1
    FROM dbo.payments_made
    WHERE payment_number LIKE 'PM-%'
    UNION ALL
    SELECT 'journal_entry', MAX(TRY_CAST(SUBSTRING(document_number, 4, 50) AS INT)) + 1
    FROM dbo.journal_entries
    WHERE document_number LIKE 'JE-%'
    UNION ALL
    SELECT 'pos_order', MAX(TRY_CAST(SUBSTRING(order_number, 5, 50) AS INT)) + 1
    FROM dbo.pos_orders
    WHERE order_number LIKE 'POS-%'
)
UPDATE ds
SET ds.next_number = CASE
    WHEN v.next_number IS NOT NULL AND v.next_number > ds.next_number THEN v.next_number
    ELSE ds.next_number
END
FROM dbo.document_sequences ds
INNER JOIN values_to_sync v ON v.document_type = ds.document_type;
GO

PRINT 'Document sequences synced successfully.';
GO
