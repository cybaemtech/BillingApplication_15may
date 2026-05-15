# SQL Server Migration Order (SSMS)

Do **not** run files from `supabase/migrations` in SSMS. Those are PostgreSQL/Supabase scripts.

## Run Order
1. `database/reset_billing_application.sql`
2. `database/mssql/00_prerequisites.sql`
3. `database/mssql/mssql_20260302093950_c1bb9753-d7e2-4317-b975-7becf27792e6.sql`
4. `database/mssql/mssql_20260302094021_b10a1d50-950b-4150-bf48-e3544be06d98.sql`
5. `database/mssql/mssql_20260304071751_ee45dae4-8ac1-48f9-beea-57e882293f1c.sql`
6. `database/mssql/mssql_20260304074909_10fc12f6-6726-4dd7-b9f8-e0f1f31b7348.sql`
7. `database/mssql/mssql_20260325120000_add_missing_tenant_id_columns.sql`
8. `database/mssql/mssql_20260325123000_sync_document_sequences.sql`
9. `database/mssql/mssql_20260326121500_multitenant_saas_rbac_bootstrap.sql`
10. `database/mssql/06_shared_schema_additions.sql`

## SSMS Execution Steps
1. Open SSMS and connect to `DESKTOP-9LSMK42\SQLEXPRESS` (Windows Authentication).
2. Open a new query window.
3. Run file #1 completely (this recreates `billing_application`).
4. Switch database dropdown to `billing_application`.
5. Run files #2 to #10 one by one, in exact order.
6. After each run, confirm `Command(s) completed successfully` before moving to next file.
7. Refresh `Databases > billing_application > Tables` in Object Explorer.

## Notes
- Converted files intentionally remove PostgreSQL-only items (RLS policies, `plpgsql` functions, Supabase auth hooks).
- If you rerun seed scripts and get duplicate key errors, reset DB again using file #1 and rerun in order.
