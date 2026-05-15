/*
  SQL Server reset script for billing_application
  Run in SQL Server Management Studio (SSMS).
*/

USE [master];
GO

IF DB_ID(N'billing_application') IS NOT NULL
BEGIN
  ALTER DATABASE [billing_application] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE [billing_application];
END;
GO

CREATE DATABASE [billing_application];
GO

ALTER DATABASE [billing_application] SET RECOVERY SIMPLE;
GO

USE [billing_application];
GO

PRINT 'billing_application database has been recreated.';
GO
