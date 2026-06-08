SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @tables TABLE (table_name SYSNAME);
INSERT INTO @tables (table_name) VALUES
  ('item_categories'),
  ('price_lists'),
  ('price_list_items'),
  ('warehouses'),
  ('warehouse_stock'),
  ('inventory_adjustments'),
  ('inventory_adjustment_items'),
  ('stock_transfers'),
  ('stock_transfer_items'),
  ('stock_movements'),
  ('pos_sessions'),
  ('pos_orders'),
  ('pos_order_items'),
  ('pos_payments');

DECLARE @table_name SYSNAME;
DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT table_name FROM @tables;
OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table_name;

WHILE @@FETCH_STATUS = 0
BEGIN
  IF COL_LENGTH('dbo.' + @table_name, 'tenant_id') IS NULL
    EXEC('ALTER TABLE dbo.' + QUOTENAME(@table_name) + ' ADD tenant_id UNIQUEIDENTIFIER NULL;');

  FETCH NEXT FROM table_cursor INTO @table_name;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

DECLARE @default_tenant_id UNIQUEIDENTIFIER =
  (SELECT TOP 1 id FROM dbo.companies ORDER BY created_at ASC);

UPDATE w
SET tenant_id = COALESCE(w.tenant_id, b.company_id, @default_tenant_id)
FROM dbo.warehouses w
LEFT JOIN dbo.branches b ON b.id = w.branch_id
WHERE w.tenant_id IS NULL;

UPDATE dbo.item_categories
SET tenant_id = @default_tenant_id
WHERE tenant_id IS NULL;

UPDATE dbo.price_lists
SET tenant_id = @default_tenant_id
WHERE tenant_id IS NULL;

UPDATE pli
SET tenant_id = COALESCE(pl.tenant_id, i.tenant_id, @default_tenant_id)
FROM dbo.price_list_items pli
LEFT JOIN dbo.price_lists pl ON pl.id = pli.price_list_id
LEFT JOIN dbo.items i ON i.id = pli.item_id
WHERE pli.tenant_id IS NULL;

UPDATE ws
SET tenant_id = COALESCE(w.tenant_id, i.tenant_id, @default_tenant_id)
FROM dbo.warehouse_stock ws
LEFT JOIN dbo.warehouses w ON w.id = ws.warehouse_id
LEFT JOIN dbo.items i ON i.id = ws.item_id
WHERE ws.tenant_id IS NULL;

UPDATE ia
SET tenant_id = COALESCE(w.tenant_id, @default_tenant_id)
FROM dbo.inventory_adjustments ia
LEFT JOIN dbo.warehouses w ON w.id = ia.warehouse_id
WHERE ia.tenant_id IS NULL;

UPDATE iai
SET tenant_id = COALESCE(ia.tenant_id, i.tenant_id, @default_tenant_id)
FROM dbo.inventory_adjustment_items iai
LEFT JOIN dbo.inventory_adjustments ia ON ia.id = iai.adjustment_id
LEFT JOIN dbo.items i ON i.id = iai.item_id
WHERE iai.tenant_id IS NULL;

UPDATE st
SET tenant_id = COALESCE(wf.tenant_id, wt.tenant_id, @default_tenant_id)
FROM dbo.stock_transfers st
LEFT JOIN dbo.warehouses wf ON wf.id = st.from_warehouse_id
LEFT JOIN dbo.warehouses wt ON wt.id = st.to_warehouse_id
WHERE st.tenant_id IS NULL;

UPDATE sti
SET tenant_id = COALESCE(st.tenant_id, i.tenant_id, @default_tenant_id)
FROM dbo.stock_transfer_items sti
LEFT JOIN dbo.stock_transfers st ON st.id = sti.transfer_id
LEFT JOIN dbo.items i ON i.id = sti.item_id
WHERE sti.tenant_id IS NULL;

UPDATE sm
SET tenant_id = COALESCE(i.tenant_id, @default_tenant_id)
FROM dbo.stock_movements sm
LEFT JOIN dbo.items i ON i.id = sm.item_id
WHERE sm.tenant_id IS NULL;

UPDATE ps
SET tenant_id = COALESCE(ur.tenant_id, p.tenant_id, @default_tenant_id)
FROM dbo.pos_sessions ps
LEFT JOIN dbo.user_roles ur ON ur.user_id = ps.opened_by
LEFT JOIN dbo.profiles p ON p.user_id = ps.opened_by
WHERE ps.tenant_id IS NULL;

UPDATE po
SET tenant_id = COALESCE(ps.tenant_id, c.tenant_id, ur.tenant_id, p.tenant_id, @default_tenant_id)
FROM dbo.pos_orders po
LEFT JOIN dbo.pos_sessions ps ON ps.id = po.session_id
LEFT JOIN dbo.customers c ON c.id = po.customer_id
LEFT JOIN dbo.user_roles ur ON ur.user_id = po.created_by
LEFT JOIN dbo.profiles p ON p.user_id = po.created_by
WHERE po.tenant_id IS NULL;

UPDATE poi
SET tenant_id = COALESCE(po.tenant_id, i.tenant_id, @default_tenant_id)
FROM dbo.pos_order_items poi
LEFT JOIN dbo.pos_orders po ON po.id = poi.order_id
LEFT JOIN dbo.items i ON i.id = poi.item_id
WHERE poi.tenant_id IS NULL;

UPDATE pp
SET tenant_id = COALESCE(po.tenant_id, @default_tenant_id)
FROM dbo.pos_payments pp
LEFT JOIN dbo.pos_orders po ON po.id = pp.order_id
WHERE pp.tenant_id IS NULL;
GO

DECLARE @tables TABLE (table_name SYSNAME);
INSERT INTO @tables (table_name) VALUES
  ('item_categories'),
  ('price_lists'),
  ('price_list_items'),
  ('warehouses'),
  ('warehouse_stock'),
  ('inventory_adjustments'),
  ('inventory_adjustment_items'),
  ('stock_transfers'),
  ('stock_transfer_items'),
  ('stock_movements'),
  ('pos_sessions'),
  ('pos_orders'),
  ('pos_order_items'),
  ('pos_payments');

DECLARE @table_name SYSNAME;
DECLARE @sql NVARCHAR(MAX);
DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT table_name FROM @tables;
OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table_name;

WHILE @@FETCH_STATUS = 0
BEGIN
  SET @sql =
    'IF EXISTS (SELECT 1 FROM dbo.' + QUOTENAME(@table_name) + ' WHERE tenant_id IS NULL) '
    + 'THROW 51000, ''Cannot enforce tenant ownership on dbo.' + @table_name + ': unresolved rows remain.'', 1; '
    + 'ALTER TABLE dbo.' + QUOTENAME(@table_name) + ' ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;';
  EXEC sp_executesql @sql;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.' + @table_name)
      AND name = 'IX_' + @table_name + '_tenant_id'
  )
  BEGIN
    SET @sql = 'CREATE INDEX ' + QUOTENAME('IX_' + @table_name + '_tenant_id')
      + ' ON dbo.' + QUOTENAME(@table_name) + ' (tenant_id);';
    EXEC sp_executesql @sql;
  END

  FETCH NEXT FROM table_cursor INTO @table_name;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

IF EXISTS (
  SELECT 1 FROM sys.key_constraints
  WHERE name = 'UQ_inventory_adjustments_doc_number'
    AND parent_object_id = OBJECT_ID('dbo.inventory_adjustments')
)
  ALTER TABLE dbo.inventory_adjustments DROP CONSTRAINT UQ_inventory_adjustments_doc_number;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UQ_inventory_adjustments_tenant_doc_number'
    AND object_id = OBJECT_ID('dbo.inventory_adjustments')
)
  CREATE UNIQUE INDEX UQ_inventory_adjustments_tenant_doc_number
    ON dbo.inventory_adjustments (tenant_id, document_number);

IF EXISTS (
  SELECT 1 FROM sys.key_constraints
  WHERE name = 'UQ_stock_transfers_doc_number'
    AND parent_object_id = OBJECT_ID('dbo.stock_transfers')
)
  ALTER TABLE dbo.stock_transfers DROP CONSTRAINT UQ_stock_transfers_doc_number;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UQ_stock_transfers_tenant_doc_number'
    AND object_id = OBJECT_ID('dbo.stock_transfers')
)
  CREATE UNIQUE INDEX UQ_stock_transfers_tenant_doc_number
    ON dbo.stock_transfers (tenant_id, document_number);

IF EXISTS (
  SELECT 1 FROM sys.key_constraints
  WHERE name = 'UQ_pos_orders_number'
    AND parent_object_id = OBJECT_ID('dbo.pos_orders')
)
  ALTER TABLE dbo.pos_orders DROP CONSTRAINT UQ_pos_orders_number;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UQ_pos_orders_tenant_order_number'
    AND object_id = OBJECT_ID('dbo.pos_orders')
)
  CREATE UNIQUE INDEX UQ_pos_orders_tenant_order_number
    ON dbo.pos_orders (tenant_id, order_number);
GO
