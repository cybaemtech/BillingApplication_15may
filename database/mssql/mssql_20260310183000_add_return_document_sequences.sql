SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

INSERT INTO dbo.document_sequences (document_type, prefix, next_number, padding)
SELECT * FROM (VALUES
    ('sales_return', 'SR-', 1, 4),
    ('purchase_return', 'PRTN-', 1, 4)
) AS data(document_type, prefix, next_number, padding)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.document_sequences
    WHERE document_type = data.document_type
);
GO

PRINT 'Added missing sales_return and purchase_return document sequences.';
GO
