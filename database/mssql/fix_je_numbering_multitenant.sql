-- ============================================================
-- Migration: Fix Journal Entry numbering to be org-specific
-- Run this script directly against your SQL Server database
-- ============================================================

-- STEP 1: Add tenant_id column to journal_entries (if missing)
IF COL_LENGTH('dbo.journal_entries', 'tenant_id') IS NULL
BEGIN
    ALTER TABLE dbo.journal_entries ADD tenant_id UNIQUEIDENTIFIER NULL;
    PRINT 'Added tenant_id column to journal_entries';
END
ELSE
    PRINT 'journal_entries.tenant_id already exists';
GO

-- STEP 2: Populate tenant_id from companies (backfill existing records)
-- This links existing journal entries to a company via users who created them
-- If your journal_entries table has a company_id or created_by column, adjust accordingly
-- For now we skip backfill (tenant_id stays NULL for old records)
PRINT 'Skipping backfill of existing journal entries (tenant_id will be NULL for old records)';
GO

-- STEP 3: Drop the old GLOBAL unique constraint on document_number
IF EXISTS (
    SELECT 1 FROM sys.key_constraints 
    WHERE name = 'UQ_journal_entries_doc_number' 
    AND type = 'UQ'
    AND parent_object_id = OBJECT_ID('dbo.journal_entries')
)
BEGIN
    ALTER TABLE dbo.journal_entries DROP CONSTRAINT UQ_journal_entries_doc_number;
    PRINT 'Dropped constraint UQ_journal_entries_doc_number';
END
ELSE IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UQ_journal_entries_doc_number' 
    AND object_id = OBJECT_ID('dbo.journal_entries')
)
BEGIN
    DROP INDEX UQ_journal_entries_doc_number ON dbo.journal_entries;
    PRINT 'Dropped index UQ_journal_entries_doc_number';
END
ELSE
    PRINT 'UQ_journal_entries_doc_number does not exist - nothing to drop';
GO

-- STEP 4: Create new COMPOSITE unique index (tenant_id + document_number)
-- This allows JE-0001 per org, but prevents duplicates within same org
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UQ_journal_entries_tenant_doc' 
    AND object_id = OBJECT_ID('dbo.journal_entries')
)
BEGIN
    -- Filtered index: only enforces uniqueness when tenant_id is set
    CREATE UNIQUE INDEX UQ_journal_entries_tenant_doc 
    ON dbo.journal_entries(tenant_id, document_number) 
    WHERE tenant_id IS NOT NULL;
    PRINT 'Created composite unique index UQ_journal_entries_tenant_doc';
END
ELSE
    PRINT 'UQ_journal_entries_tenant_doc already exists';
GO

-- STEP 5: Make document_sequences tenant-specific
-- Add tenant_id to document_sequences if not present
IF COL_LENGTH('dbo.document_sequences', 'tenant_id') IS NULL
BEGIN
    ALTER TABLE dbo.document_sequences ADD tenant_id UNIQUEIDENTIFIER NULL;
    PRINT 'Added tenant_id column to document_sequences';
END
ELSE
    PRINT 'document_sequences.tenant_id already exists';
GO

-- STEP 6: Drop old unique constraint on document_sequences (if any)
IF EXISTS (
    SELECT 1 FROM sys.key_constraints 
    WHERE name = 'UQ_document_sequences_type' 
    AND type = 'UQ'
    AND parent_object_id = OBJECT_ID('dbo.document_sequences')
)
BEGIN
    ALTER TABLE dbo.document_sequences DROP CONSTRAINT UQ_document_sequences_type;
    PRINT 'Dropped UQ_document_sequences_type';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UQ_document_sequences_type' 
    AND object_id = OBJECT_ID('dbo.document_sequences')
)
BEGIN
    DROP INDEX UQ_document_sequences_type ON dbo.document_sequences;
    PRINT 'Dropped index UQ_document_sequences_type';
END
GO

-- STEP 7: Seed per-tenant journal_entry sequences for all existing companies
-- This ensures each company has its own JE sequence starting from 1
-- (or from next available number if they already have entries)
INSERT INTO dbo.document_sequences (id, tenant_id, document_type, prefix, next_number, padding)
SELECT 
    NEWID(),
    c.id AS tenant_id,
    'journal_entry',
    'JE-',
    ISNULL(
        (
            SELECT MAX(TRY_CAST(SUBSTRING(je.document_number, 4, 50) AS INT)) + 1
            FROM dbo.journal_entries je
            WHERE je.tenant_id = c.id
            AND je.document_number LIKE 'JE-%'
        ),
        1
    ),
    4
FROM dbo.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.document_sequences ds 
    WHERE ds.tenant_id = c.id 
    AND ds.document_type = 'journal_entry'
);
PRINT 'Seeded per-tenant journal_entry sequences';
GO

PRINT '=================================================';
PRINT 'Migration complete! Journal Entry numbers are now org-specific.';
PRINT '=================================================';
GO
