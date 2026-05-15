USE [billing_application];
GO

IF OBJECT_ID(N'dbo.auth_sessions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auth_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    jwt_token NVARCHAR(2000) NOT NULL,
    issued_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,
    revoked_at DATETIME2 NULL,
    ip_address VARCHAR(64) NULL,
    user_agent NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_auth_sessions_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

IF OBJECT_ID(N'dbo.auth_audit_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auth_audit_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NULL,
    email NVARCHAR(255) NULL,
    event_type VARCHAR(50) NOT NULL,
    success BIT NOT NULL DEFAULT 1,
    message NVARCHAR(1000) NULL,
    ip_address VARCHAR(64) NULL,
    user_agent NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_auth_audit_logs_users FOREIGN KEY (user_id) REFERENCES dbo.users(id)
  );
END
GO

IF OBJECT_ID(N'dbo.password_resets', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.password_resets (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    token NVARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_password_resets_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
  );
END
GO

IF OBJECT_ID(N'dbo.module_settings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.module_settings (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    module_key VARCHAR(50) NOT NULL UNIQUE,
    settings_json NVARCHAR(4000) NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_module_settings_users FOREIGN KEY (updated_by) REFERENCES dbo.users(id)
  );
END
GO

IF OBJECT_ID(N'dbo.expense_categories', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.expense_categories (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF OBJECT_ID(N'dbo.report_templates', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.report_templates (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    config NVARCHAR(4000) NULL,
    is_default BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_report_templates_users FOREIGN KEY (created_by) REFERENCES dbo.users(id)
  );
END
GO

IF OBJECT_ID(N'dbo.saved_reports', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.saved_reports (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NULL,
    name NVARCHAR(255) NOT NULL,
    period_from DATE NULL,
    period_to DATE NULL,
    data NVARCHAR(8000) NULL,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_saved_reports_templates FOREIGN KEY (template_id) REFERENCES dbo.report_templates(id),
    CONSTRAINT FK_saved_reports_users FOREIGN KEY (created_by) REFERENCES dbo.users(id)
  );
END
GO

IF OBJECT_ID(N'dbo.automation_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.automation_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    workflow_id UNIQUEIDENTIFIER NULL,
    trigger_event VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message NVARCHAR(2000) NULL,
    executed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_automation_logs_workflows FOREIGN KEY (workflow_id) REFERENCES dbo.workflows(id) ON DELETE CASCADE
  );
END
GO
