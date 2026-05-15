USE [master]
GO
/****** Object:  Database [billing_application]    Script Date: 12-03-2026 15:49:46 ******/
CREATE DATABASE [billing_application]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'billing_application', FILENAME = N'D:\SQL server\MSSQL17.SQLEXPRESS\MSSQL\DATA\billing_application.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'billing_application_log', FILENAME = N'D:\SQL server\MSSQL17.SQLEXPRESS\MSSQL\DATA\billing_application_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [billing_application].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [billing_application] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [billing_application] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [billing_application] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [billing_application] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [billing_application] SET ARITHABORT OFF 
GO
ALTER DATABASE [billing_application] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [billing_application] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [billing_application] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [billing_application] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [billing_application] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [billing_application] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [billing_application] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [billing_application] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [billing_application] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [billing_application] SET  ENABLE_BROKER 
GO
ALTER DATABASE [billing_application] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [billing_application] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [billing_application] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [billing_application] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [billing_application] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [billing_application] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [billing_application] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [billing_application] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [billing_application] SET  MULTI_USER 
GO
ALTER DATABASE [billing_application] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [billing_application] SET DB_CHAINING OFF 
GO
ALTER DATABASE [billing_application] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [billing_application] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [billing_application] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [billing_application] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [billing_application] SET QUERY_STORE = ON
GO
ALTER DATABASE [billing_application] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [billing_application]
GO
/****** Object:  User [LAPTOP-4M368TIF\Ganesh]    Script Date: 12-03-2026 15:49:47 ******/
CREATE USER [LAPTOP-4M368TIF\Ganesh] FOR LOGIN [LAPTOP-4M368TIF\Ganesh] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [billflow]    Script Date: 12-03-2026 15:49:47 ******/
CREATE USER [billflow] FOR LOGIN [billflow] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_owner] ADD MEMBER [LAPTOP-4M368TIF\Ganesh]
GO
ALTER ROLE [db_owner] ADD MEMBER [billflow]
GO
/****** Object:  Table [dbo].[account_groups]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[account_groups](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[parent_id] [uniqueidentifier] NULL,
	[nature] [nvarchar](20) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[accounts]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[accounts](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[account_type] [nvarchar](50) NOT NULL,
	[parent_id] [uniqueidentifier] NULL,
	[is_system] [bit] NOT NULL,
	[balance] [decimal](15, 2) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_accounts_code] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[activity_logs]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[activity_logs](
	[id] [uniqueidentifier] NOT NULL,
	[module] [nvarchar](100) NOT NULL,
	[record_id] [uniqueidentifier] NOT NULL,
	[action] [nvarchar](100) NOT NULL,
	[details] [nvarchar](max) NULL,
	[user_id] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[attachments]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[attachments](
	[id] [uniqueidentifier] NOT NULL,
	[record_type] [nvarchar](100) NOT NULL,
	[record_id] [uniqueidentifier] NOT NULL,
	[file_name] [nvarchar](500) NOT NULL,
	[file_url] [nvarchar](500) NOT NULL,
	[file_size] [int] NULL,
	[mime_type] [nvarchar](100) NULL,
	[uploaded_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[audit_trail]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[audit_trail](
	[id] [uniqueidentifier] NOT NULL,
	[table_name] [nvarchar](255) NOT NULL,
	[record_id] [uniqueidentifier] NOT NULL,
	[action] [nvarchar](50) NOT NULL,
	[old_data] [nvarchar](max) NULL,
	[new_data] [nvarchar](max) NULL,
	[user_id] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auth_audit_logs]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_audit_logs](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NULL,
	[email] [nvarchar](255) NULL,
	[event_type] [varchar](50) NOT NULL,
	[success] [bit] NOT NULL,
	[message] [nvarchar](1000) NULL,
	[ip_address] [varchar](64) NULL,
	[user_agent] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auth_sessions]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_sessions](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NOT NULL,
	[jwt_token] [nvarchar](2000) NOT NULL,
	[issued_at] [datetime2](7) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[revoked_at] [datetime2](7) NULL,
	[ip_address] [varchar](64) NULL,
	[user_agent] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[automation_logs]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[automation_logs](
	[id] [uniqueidentifier] NOT NULL,
	[workflow_id] [uniqueidentifier] NULL,
	[trigger_event] [varchar](100) NULL,
	[status] [varchar](20) NOT NULL,
	[error_message] [nvarchar](2000) NULL,
	[executed_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[backups]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[backups](
	[id] [uniqueidentifier] NOT NULL,
	[file_name] [nvarchar](500) NOT NULL,
	[file_url] [nvarchar](500) NULL,
	[size_bytes] [bigint] NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bank_accounts]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_accounts](
	[id] [uniqueidentifier] NOT NULL,
	[account_id] [uniqueidentifier] NULL,
	[bank_name] [nvarchar](255) NOT NULL,
	[account_number] [nvarchar](100) NULL,
	[ifsc_code] [nvarchar](50) NULL,
	[branch_name] [nvarchar](255) NULL,
	[current_balance] [decimal](18, 2) NOT NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bank_reconciliation]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_reconciliation](
	[id] [uniqueidentifier] NOT NULL,
	[bank_account_id] [uniqueidentifier] NOT NULL,
	[statement_date] [date] NOT NULL,
	[statement_balance] [decimal](18, 2) NOT NULL,
	[reconciled_balance] [decimal](18, 2) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bank_transactions]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_transactions](
	[id] [uniqueidentifier] NOT NULL,
	[bank_account_id] [uniqueidentifier] NOT NULL,
	[date] [date] NOT NULL,
	[type] [nvarchar](20) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[description] [nvarchar](max) NULL,
	[reference_number] [nvarchar](100) NULL,
	[is_reconciled] [bit] NULL,
	[reconciled_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bill_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bill_items](
	[id] [uniqueidentifier] NOT NULL,
	[bill_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bills]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bills](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[due_date] [date] NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[purchase_order_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[balance_due] [decimal](15, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_bills_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[branches]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[branches](
	[id] [uniqueidentifier] NOT NULL,
	[company_id] [uniqueidentifier] NOT NULL,
	[branch_name] [nvarchar](255) NOT NULL,
	[address] [nvarchar](max) NULL,
	[city] [nvarchar](100) NULL,
	[state] [nvarchar](100) NULL,
	[phone] [nvarchar](50) NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[companies]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[companies](
	[id] [uniqueidentifier] NOT NULL,
	[company_name] [nvarchar](500) NOT NULL,
	[gstin] [nvarchar](50) NULL,
	[pan] [nvarchar](50) NULL,
	[address] [nvarchar](max) NULL,
	[city] [nvarchar](100) NULL,
	[state] [nvarchar](100) NULL,
	[pincode] [nvarchar](20) NULL,
	[phone] [nvarchar](50) NULL,
	[email] [nvarchar](255) NULL,
	[website] [nvarchar](255) NULL,
	[logo_url] [nvarchar](500) NULL,
	[financial_year_start] [int] NULL,
	[currency] [nvarchar](10) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[credit_note_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_note_items](
	[id] [uniqueidentifier] NOT NULL,
	[credit_note_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[credit_notes]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_notes](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[reason] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_credit_notes_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[customer_contacts]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[customer_contacts](
	[id] [uniqueidentifier] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[contact_name] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NULL,
	[designation] [nvarchar](100) NULL,
	[is_primary] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[customers]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[customers](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NULL,
	[gstin] [nvarchar](50) NULL,
	[pan] [nvarchar](50) NULL,
	[billing_address] [nvarchar](max) NULL,
	[shipping_address] [nvarchar](max) NULL,
	[state] [nvarchar](100) NULL,
	[credit_limit] [decimal](15, 2) NULL,
	[outstanding_balance] [decimal](15, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[delivery_challan_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[delivery_challan_items](
	[id] [uniqueidentifier] NOT NULL,
	[delivery_challan_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
	[rate] [decimal](18, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[delivery_challans]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[delivery_challans](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[sales_order_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_delivery_challans_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_sequences]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_sequences](
	[id] [uniqueidentifier] NOT NULL,
	[document_type] [nvarchar](50) NOT NULL,
	[prefix] [nvarchar](20) NOT NULL,
	[next_number] [int] NOT NULL,
	[padding] [int] NOT NULL,
	[financial_year] [nvarchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_document_sequences_type] UNIQUE NONCLUSTERED 
(
	[document_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[e_invoice_records]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[e_invoice_records](
	[id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[irn] [nvarchar](100) NULL,
	[ack_number] [nvarchar](100) NULL,
	[ack_date] [datetime2](7) NULL,
	[signed_invoice] [nvarchar](max) NULL,
	[status] [nvarchar](50) NOT NULL,
	[error_message] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[e_way_bills]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[e_way_bills](
	[id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[eway_bill_number] [nvarchar](100) NULL,
	[valid_from] [datetime2](7) NULL,
	[valid_until] [datetime2](7) NULL,
	[vehicle_number] [nvarchar](50) NULL,
	[transporter_name] [nvarchar](255) NULL,
	[distance_km] [decimal](18, 2) NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[email_logs]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[email_logs](
	[id] [uniqueidentifier] NOT NULL,
	[to_email] [nvarchar](255) NOT NULL,
	[subject] [nvarchar](255) NOT NULL,
	[body] [nvarchar](max) NULL,
	[status] [nvarchar](50) NOT NULL,
	[document_type] [nvarchar](100) NULL,
	[document_id] [uniqueidentifier] NULL,
	[sent_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[email_settings]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[email_settings](
	[id] [uniqueidentifier] NOT NULL,
	[smtp_host] [nvarchar](255) NULL,
	[smtp_port] [int] NULL,
	[smtp_username] [nvarchar](255) NULL,
	[smtp_password] [nvarchar](255) NULL,
	[from_email] [nvarchar](255) NULL,
	[from_name] [nvarchar](255) NULL,
	[is_active] [bit] NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[expense_categories]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[expense_categories](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[expenses]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[expenses](
	[id] [uniqueidentifier] NOT NULL,
	[date] [date] NOT NULL,
	[category] [nvarchar](100) NOT NULL,
	[vendor_id] [uniqueidentifier] NULL,
	[account_id] [uniqueidentifier] NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[payment_mode] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[is_recurring] [bit] NOT NULL,
	[recurring_frequency] [nvarchar](20) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[financial_periods]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[financial_periods](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NOT NULL,
	[is_closed] [bit] NULL,
	[closed_by] [uniqueidentifier] NULL,
	[closed_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[gst_returns]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gst_returns](
	[id] [uniqueidentifier] NOT NULL,
	[return_type] [nvarchar](50) NOT NULL,
	[period] [nvarchar](20) NOT NULL,
	[filing_date] [date] NULL,
	[status] [nvarchar](50) NOT NULL,
	[data] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[gst_settings]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gst_settings](
	[id] [uniqueidentifier] NOT NULL,
	[gstin] [nvarchar](50) NULL,
	[legal_name] [nvarchar](255) NULL,
	[trade_name] [nvarchar](255) NULL,
	[state] [nvarchar](100) NULL,
	[state_code] [nvarchar](10) NULL,
	[is_composition] [bit] NOT NULL,
	[reverse_charge_applicable] [bit] NOT NULL,
	[einvoice_enabled] [bit] NOT NULL,
	[eway_bill_enabled] [bit] NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[inventory_adjustment_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inventory_adjustment_items](
	[id] [uniqueidentifier] NOT NULL,
	[adjustment_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[quantity_on_hand] [decimal](18, 2) NOT NULL,
	[adjusted_quantity] [decimal](18, 2) NOT NULL,
	[difference] [decimal](18, 2) NOT NULL,
	[cost_price] [decimal](18, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[inventory_adjustments]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inventory_adjustments](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[reason] [nvarchar](max) NULL,
	[status] [nvarchar](50) NOT NULL,
	[warehouse_id] [uniqueidentifier] NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_inventory_adjustments_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[invoice_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[invoice_items](
	[id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[invoice_settings]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[invoice_settings](
	[id] [uniqueidentifier] NOT NULL,
	[template_id] [nvarchar](100) NOT NULL,
	[show_logo] [bit] NULL,
	[show_signature] [bit] NULL,
	[footer_text] [nvarchar](max) NULL,
	[terms_text] [nvarchar](max) NULL,
	[notes_text] [nvarchar](max) NULL,
	[accent_color] [nvarchar](20) NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[invoices]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[invoices](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[due_date] [date] NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[sales_order_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[balance_due] [decimal](15, 2) NOT NULL,
	[irn] [nvarchar](100) NULL,
	[eway_bill] [nvarchar](100) NULL,
	[notes] [nvarchar](max) NULL,
	[terms] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_invoices_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[item_categories]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[item_categories](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[parent_id] [uniqueidentifier] NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[items](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[sku] [nvarchar](100) NULL,
	[hsn_code] [nvarchar](20) NULL,
	[category] [nvarchar](100) NULL,
	[unit] [nvarchar](20) NOT NULL,
	[purchase_rate] [decimal](15, 2) NOT NULL,
	[selling_rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[opening_stock] [decimal](15, 2) NOT NULL,
	[current_stock] [decimal](15, 2) NOT NULL,
	[reorder_level] [decimal](15, 2) NULL,
	[is_active] [bit] NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_items_sku] UNIQUE NONCLUSTERED 
(
	[sku] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[journal_entries]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[journal_entries](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[journal_type] [varchar](30) NOT NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[description] [nvarchar](max) NULL,
	[is_auto] [bit] NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_journal_entries_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[journal_entry_lines]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[journal_entry_lines](
	[id] [uniqueidentifier] NOT NULL,
	[journal_entry_id] [uniqueidentifier] NOT NULL,
	[account_id] [uniqueidentifier] NOT NULL,
	[debit] [decimal](15, 2) NOT NULL,
	[credit] [decimal](15, 2) NOT NULL,
	[description] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[module_settings]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[module_settings](
	[id] [uniqueidentifier] NOT NULL,
	[module_key] [varchar](50) NOT NULL,
	[settings_json] [nvarchar](4000) NULL,
	[updated_by] [uniqueidentifier] NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[module_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notifications]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notifications](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[message] [nvarchar](max) NULL,
	[type] [nvarchar](50) NOT NULL,
	[is_read] [bit] NULL,
	[link] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[password_resets]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[password_resets](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NOT NULL,
	[token] [nvarchar](255) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[used_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payment_allocations]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_allocations](
	[id] [uniqueidentifier] NOT NULL,
	[payment_id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payment_made_allocations]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_made_allocations](
	[id] [uniqueidentifier] NOT NULL,
	[payment_id] [uniqueidentifier] NOT NULL,
	[bill_id] [uniqueidentifier] NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payments_made]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments_made](
	[id] [uniqueidentifier] NOT NULL,
	[payment_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[bill_id] [uniqueidentifier] NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[payment_mode] [nvarchar](50) NOT NULL,
	[reference_number] [nvarchar](100) NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_payments_made_number] UNIQUE NONCLUSTERED 
(
	[payment_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payments_received]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments_received](
	[id] [uniqueidentifier] NOT NULL,
	[payment_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[payment_mode] [nvarchar](50) NOT NULL,
	[reference_number] [nvarchar](100) NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_payments_received_number] UNIQUE NONCLUSTERED 
(
	[payment_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pos_order_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pos_order_items](
	[id] [uniqueidentifier] NOT NULL,
	[order_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[item_name] [nvarchar](255) NOT NULL,
	[quantity] [decimal](18, 2) NOT NULL,
	[rate] [decimal](18, 2) NOT NULL,
	[discount] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pos_orders]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pos_orders](
	[id] [uniqueidentifier] NOT NULL,
	[session_id] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NULL,
	[customer_id] [uniqueidentifier] NULL,
	[order_number] [nvarchar](50) NOT NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[discount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_pos_orders_number] UNIQUE NONCLUSTERED 
(
	[order_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pos_payments]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pos_payments](
	[id] [uniqueidentifier] NOT NULL,
	[order_id] [uniqueidentifier] NOT NULL,
	[payment_mode] [nvarchar](50) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[reference_number] [nvarchar](100) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pos_sessions]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pos_sessions](
	[id] [uniqueidentifier] NOT NULL,
	[opened_by] [uniqueidentifier] NOT NULL,
	[opened_at] [datetime2](7) NOT NULL,
	[closed_at] [datetime2](7) NULL,
	[opening_balance] [decimal](18, 2) NOT NULL,
	[closing_balance] [decimal](18, 2) NULL,
	[total_sales] [decimal](18, 2) NULL,
	[total_cash] [decimal](18, 2) NULL,
	[total_upi] [decimal](18, 2) NULL,
	[total_card] [decimal](18, 2) NULL,
	[status] [nvarchar](50) NOT NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[price_list_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[price_list_items](
	[id] [uniqueidentifier] NOT NULL,
	[price_list_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[rate] [decimal](18, 2) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[price_lists]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[price_lists](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[profiles]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[profiles](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NOT NULL,
	[display_name] [nvarchar](255) NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_profiles_user] UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_order_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_order_items](
	[id] [uniqueidentifier] NOT NULL,
	[purchase_order_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_orders]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_orders](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[expected_delivery] [date] NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_purchase_orders_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_return_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_return_items](
	[id] [uniqueidentifier] NOT NULL,
	[purchase_return_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 2) NOT NULL,
	[rate] [decimal](18, 2) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[sort_order] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[purchase_returns]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[purchase_returns](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[bill_id] [uniqueidentifier] NULL,
	[status] [nvarchar](50) NOT NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
	[reason] [nvarchar](max) NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_purchase_returns_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quotation_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quotation_items](
	[id] [uniqueidentifier] NOT NULL,
	[quotation_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quotations]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quotations](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[valid_until] [date] NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[terms] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_quotations_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[recurring_bills]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[recurring_bills](
	[id] [uniqueidentifier] NOT NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[frequency] [nvarchar](50) NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NULL,
	[next_bill_date] [date] NULL,
	[base_bill_id] [uniqueidentifier] NULL,
	[is_active] [bit] NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[recurring_invoices]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[recurring_invoices](
	[id] [uniqueidentifier] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[frequency] [nvarchar](50) NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NULL,
	[next_invoice_date] [date] NULL,
	[base_invoice_id] [uniqueidentifier] NULL,
	[is_active] [bit] NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[report_cache]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[report_cache](
	[id] [uniqueidentifier] NOT NULL,
	[report_type] [nvarchar](100) NOT NULL,
	[period] [nvarchar](50) NOT NULL,
	[data] [nvarchar](max) NULL,
	[generated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_report_cache] UNIQUE NONCLUSTERED 
(
	[report_type] ASC,
	[period] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[report_templates]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[report_templates](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[report_type] [varchar](50) NOT NULL,
	[config] [nvarchar](4000) NULL,
	[is_default] [bit] NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sales_order_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sales_order_items](
	[id] [uniqueidentifier] NOT NULL,
	[sales_order_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sales_orders]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sales_orders](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[expected_delivery] [date] NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[quotation_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_sales_orders_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sales_return_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sales_return_items](
	[id] [uniqueidentifier] NOT NULL,
	[sales_return_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 2) NOT NULL,
	[rate] [decimal](18, 2) NOT NULL,
	[amount] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[sort_order] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sales_returns]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sales_returns](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[customer_id] [uniqueidentifier] NOT NULL,
	[invoice_id] [uniqueidentifier] NULL,
	[status] [nvarchar](50) NOT NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[tax_amount] [decimal](18, 2) NOT NULL,
	[total] [decimal](18, 2) NOT NULL,
	[reason] [nvarchar](max) NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_sales_returns_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[saved_reports]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[saved_reports](
	[id] [uniqueidentifier] NOT NULL,
	[template_id] [uniqueidentifier] NULL,
	[name] [nvarchar](255) NOT NULL,
	[period_from] [date] NULL,
	[period_to] [date] NULL,
	[data] [nvarchar](4000) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[stock_movements]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stock_movements](
	[id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[movement_type] [varchar](30) NOT NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[cost_price] [decimal](15, 2) NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[stock_transfer_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stock_transfer_items](
	[id] [uniqueidentifier] NOT NULL,
	[transfer_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[stock_transfers]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stock_transfers](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[from_warehouse_id] [uniqueidentifier] NULL,
	[to_warehouse_id] [uniqueidentifier] NULL,
	[status] [nvarchar](50) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_stock_transfers_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[system_settings]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[system_settings](
	[id] [uniqueidentifier] NOT NULL,
	[key] [nvarchar](255) NOT NULL,
	[value] [nvarchar](max) NULL,
	[category] [nvarchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_system_settings_key] UNIQUE NONCLUSTERED 
(
	[key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tax_groups]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tax_groups](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tax_rates]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tax_rates](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[rate] [decimal](5, 2) NOT NULL,
	[tax_type] [nvarchar](50) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[cgst] [decimal](18, 2) NOT NULL,
	[sgst] [decimal](18, 2) NOT NULL,
	[igst] [decimal](18, 2) NOT NULL,
	[is_default] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[units]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[units](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[abbreviation] [nvarchar](20) NOT NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_roles]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_roles](
	[id] [uniqueidentifier] NOT NULL,
	[user_id] [uniqueidentifier] NOT NULL,
	[role] [varchar](50) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_user_roles] UNIQUE NONCLUSTERED 
(
	[user_id] ASC,
	[role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[users]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[id] [uniqueidentifier] NOT NULL,
	[username] [nvarchar](100) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[is_active] [bit] NOT NULL,
	[last_login] [datetime2](7) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_users_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_users_username] UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vendor_contacts]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vendor_contacts](
	[id] [uniqueidentifier] NOT NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[contact_name] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NULL,
	[designation] [nvarchar](100) NULL,
	[is_primary] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vendor_credit_items]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vendor_credit_items](
	[id] [uniqueidentifier] NOT NULL,
	[vendor_credit_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](max) NULL,
	[quantity] [decimal](15, 2) NOT NULL,
	[rate] [decimal](15, 2) NOT NULL,
	[tax_rate_id] [uniqueidentifier] NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[amount] [decimal](15, 2) NOT NULL,
	[sort_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vendor_credits]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vendor_credits](
	[id] [uniqueidentifier] NOT NULL,
	[document_number] [nvarchar](50) NOT NULL,
	[date] [date] NOT NULL,
	[vendor_id] [uniqueidentifier] NOT NULL,
	[bill_id] [uniqueidentifier] NULL,
	[reference_id] [uniqueidentifier] NULL,
	[reference_type] [nvarchar](100) NULL,
	[status] [varchar](30) NOT NULL,
	[subtotal] [decimal](15, 2) NOT NULL,
	[tax_amount] [decimal](15, 2) NOT NULL,
	[total] [decimal](15, 2) NOT NULL,
	[reason] [nvarchar](max) NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_vendor_credits_doc_number] UNIQUE NONCLUSTERED 
(
	[document_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vendors]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vendors](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NULL,
	[gstin] [nvarchar](50) NULL,
	[pan] [nvarchar](50) NULL,
	[address] [nvarchar](max) NULL,
	[state] [nvarchar](100) NULL,
	[outstanding_balance] [decimal](15, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[warehouse_stock]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[warehouse_stock](
	[id] [uniqueidentifier] NOT NULL,
	[warehouse_id] [uniqueidentifier] NOT NULL,
	[item_id] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 2) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_warehouse_stock] UNIQUE NONCLUSTERED 
(
	[warehouse_id] ASC,
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[warehouses]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[warehouses](
	[id] [uniqueidentifier] NOT NULL,
	[branch_id] [uniqueidentifier] NULL,
	[warehouse_name] [nvarchar](255) NOT NULL,
	[address] [nvarchar](max) NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[workflow_actions]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[workflow_actions](
	[id] [uniqueidentifier] NOT NULL,
	[workflow_id] [uniqueidentifier] NOT NULL,
	[action_type] [nvarchar](100) NOT NULL,
	[action_config] [nvarchar](max) NULL,
	[sort_order] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[workflow_logs]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[workflow_logs](
	[id] [uniqueidentifier] NOT NULL,
	[workflow_id] [uniqueidentifier] NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[details] [nvarchar](max) NULL,
	[executed_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[workflows]    Script Date: 12-03-2026 15:49:47 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[workflows](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[trigger_event] [nvarchar](100) NOT NULL,
	[conditions] [nvarchar](max) NULL,
	[is_active] [bit] NULL,
	[created_by] [uniqueidentifier] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [IX_account_groups_parent_id]    Script Date: 12-03-2026 15:49:47 ******/
CREATE NONCLUSTERED INDEX [IX_account_groups_parent_id] ON [dbo].[account_groups]
(
	[parent_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_accounts_account_type]    Script Date: 12-03-2026 15:49:47 ******/
CREATE NONCLUSTERED INDEX [IX_accounts_account_type] ON [dbo].[accounts]
(
	[account_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_accounts_parent_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_accounts_parent_id] ON [dbo].[accounts]
(
	[parent_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_activity_logs_created_at]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_activity_logs_created_at] ON [dbo].[activity_logs]
(
	[created_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_activity_logs_record_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_activity_logs_record_id] ON [dbo].[activity_logs]
(
	[record_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_attachments_record_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_attachments_record_id] ON [dbo].[attachments]
(
	[record_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_audit_trail_created_at]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_audit_trail_created_at] ON [dbo].[audit_trail]
(
	[created_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_audit_trail_record_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_audit_trail_record_id] ON [dbo].[audit_trail]
(
	[record_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_accounts_account_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_accounts_account_id] ON [dbo].[bank_accounts]
(
	[account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_accounts_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_accounts_is_active] ON [dbo].[bank_accounts]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_reconciliation_bank_account_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_reconciliation_bank_account_id] ON [dbo].[bank_reconciliation]
(
	[bank_account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_transactions_bank_account_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_transactions_bank_account_id] ON [dbo].[bank_transactions]
(
	[bank_account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_transactions_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_transactions_date] ON [dbo].[bank_transactions]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bank_transactions_is_reconciled]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bank_transactions_is_reconciled] ON [dbo].[bank_transactions]
(
	[is_reconciled] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bill_items_bill_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bill_items_bill_id] ON [dbo].[bill_items]
(
	[bill_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bills_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bills_created_by] ON [dbo].[bills]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_bills_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_bills_vendor_id] ON [dbo].[bills]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_branches_company_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_branches_company_id] ON [dbo].[branches]
(
	[company_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_branches_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_branches_is_active] ON [dbo].[branches]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_companies_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_companies_created_by] ON [dbo].[companies]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_credit_note_items_credit_note_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_credit_note_items_credit_note_id] ON [dbo].[credit_note_items]
(
	[credit_note_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_credit_notes_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_credit_notes_created_by] ON [dbo].[credit_notes]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_credit_notes_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_credit_notes_customer_id] ON [dbo].[credit_notes]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_customer_contacts_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_customer_contacts_customer_id] ON [dbo].[customer_contacts]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_customer_contacts_is_primary]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_customer_contacts_is_primary] ON [dbo].[customer_contacts]
(
	[is_primary] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_customers_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_customers_created_by] ON [dbo].[customers]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_customers_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_customers_is_active] ON [dbo].[customers]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_delivery_challan_items_delivery_challan_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_delivery_challan_items_delivery_challan_id] ON [dbo].[delivery_challan_items]
(
	[delivery_challan_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_delivery_challans_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_delivery_challans_created_by] ON [dbo].[delivery_challans]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_delivery_challans_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_delivery_challans_customer_id] ON [dbo].[delivery_challans]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_e_invoice_records_invoice_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_e_invoice_records_invoice_id] ON [dbo].[e_invoice_records]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_e_way_bills_invoice_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_e_way_bills_invoice_id] ON [dbo].[e_way_bills]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_email_logs_document_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_email_logs_document_id] ON [dbo].[email_logs]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_expenses_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_expenses_created_by] ON [dbo].[expenses]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_expenses_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_expenses_date] ON [dbo].[expenses]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_expenses_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_expenses_vendor_id] ON [dbo].[expenses]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_financial_periods_dates]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_financial_periods_dates] ON [dbo].[financial_periods]
(
	[start_date] ASC,
	[end_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_inv_adj_items_adjustment_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_adjustment_id] ON [dbo].[inventory_adjustment_items]
(
	[adjustment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_inv_adj_items_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_inv_adj_items_item_id] ON [dbo].[inventory_adjustment_items]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_inventory_adjustments_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_inventory_adjustments_date] ON [dbo].[inventory_adjustments]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_inventory_adjustments_warehouse_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_inventory_adjustments_warehouse_id] ON [dbo].[inventory_adjustments]
(
	[warehouse_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_invoice_items_invoice_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_invoice_items_invoice_id] ON [dbo].[invoice_items]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_invoices_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_invoices_created_by] ON [dbo].[invoices]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_invoices_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_invoices_customer_id] ON [dbo].[invoices]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_invoices_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_invoices_date] ON [dbo].[invoices]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_item_categories_parent_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_item_categories_parent_id] ON [dbo].[item_categories]
(
	[parent_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_items_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_items_is_active] ON [dbo].[items]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_items_sku]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_items_sku] ON [dbo].[items]
(
	[sku] ASC
)
WHERE ([sku] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_items_tax_rate_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_items_tax_rate_id] ON [dbo].[items]
(
	[tax_rate_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_journal_entries_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_journal_entries_created_by] ON [dbo].[journal_entries]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_journal_entries_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_journal_entries_date] ON [dbo].[journal_entries]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_journal_entry_lines_account_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_journal_entry_lines_account_id] ON [dbo].[journal_entry_lines]
(
	[account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_journal_entry_lines_journal_entry_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_journal_entry_lines_journal_entry_id] ON [dbo].[journal_entry_lines]
(
	[journal_entry_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_notifications_is_read]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_notifications_is_read] ON [dbo].[notifications]
(
	[is_read] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_notifications_user_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_notifications_user_id] ON [dbo].[notifications]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payment_allocations_invoice_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payment_allocations_invoice_id] ON [dbo].[payment_allocations]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payment_allocations_payment_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payment_allocations_payment_id] ON [dbo].[payment_allocations]
(
	[payment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payment_made_allocations_bill_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payment_made_allocations_bill_id] ON [dbo].[payment_made_allocations]
(
	[bill_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payment_made_allocations_payment_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payment_made_allocations_payment_id] ON [dbo].[payment_made_allocations]
(
	[payment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_made_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_made_created_by] ON [dbo].[payments_made]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_made_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_made_date] ON [dbo].[payments_made]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_made_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_made_vendor_id] ON [dbo].[payments_made]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_received_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_received_created_by] ON [dbo].[payments_received]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_received_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_received_customer_id] ON [dbo].[payments_received]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_payments_received_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_payments_received_date] ON [dbo].[payments_received]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_order_items_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_order_items_item_id] ON [dbo].[pos_order_items]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_order_items_order_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_order_items_order_id] ON [dbo].[pos_order_items]
(
	[order_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_orders_created_at]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_orders_created_at] ON [dbo].[pos_orders]
(
	[created_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_orders_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_orders_customer_id] ON [dbo].[pos_orders]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_orders_invoice_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_orders_invoice_id] ON [dbo].[pos_orders]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_orders_session_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_orders_session_id] ON [dbo].[pos_orders]
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_payments_order_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_payments_order_id] ON [dbo].[pos_payments]
(
	[order_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_pos_sessions_opened_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_sessions_opened_by] ON [dbo].[pos_sessions]
(
	[opened_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_pos_sessions_status]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_pos_sessions_status] ON [dbo].[pos_sessions]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_price_list_items_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_price_list_items_item_id] ON [dbo].[price_list_items]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_price_list_items_price_list_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_price_list_items_price_list_id] ON [dbo].[price_list_items]
(
	[price_list_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_price_lists_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_price_lists_is_active] ON [dbo].[price_lists]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_profiles_user_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_profiles_user_id] ON [dbo].[profiles]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_order_items_purchase_order_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_order_items_purchase_order_id] ON [dbo].[purchase_order_items]
(
	[purchase_order_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_orders_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_orders_created_by] ON [dbo].[purchase_orders]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_orders_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_orders_vendor_id] ON [dbo].[purchase_orders]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_return_items_return_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_return_items_return_id] ON [dbo].[purchase_return_items]
(
	[purchase_return_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_returns_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_returns_date] ON [dbo].[purchase_returns]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_purchase_returns_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_purchase_returns_vendor_id] ON [dbo].[purchase_returns]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_quotation_items_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_quotation_items_item_id] ON [dbo].[quotation_items]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_quotation_items_quotation_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_quotation_items_quotation_id] ON [dbo].[quotation_items]
(
	[quotation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_quotations_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_quotations_created_by] ON [dbo].[quotations]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_quotations_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_quotations_customer_id] ON [dbo].[quotations]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_quotations_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_quotations_date] ON [dbo].[quotations]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_recurring_bills_next_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_recurring_bills_next_date] ON [dbo].[recurring_bills]
(
	[next_bill_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_recurring_bills_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_recurring_bills_vendor_id] ON [dbo].[recurring_bills]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_recurring_invoices_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_recurring_invoices_customer_id] ON [dbo].[recurring_invoices]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_recurring_invoices_next_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_recurring_invoices_next_date] ON [dbo].[recurring_invoices]
(
	[next_invoice_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_order_items_sales_order_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_order_items_sales_order_id] ON [dbo].[sales_order_items]
(
	[sales_order_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_orders_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_orders_created_by] ON [dbo].[sales_orders]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_orders_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_orders_customer_id] ON [dbo].[sales_orders]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_orders_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_orders_date] ON [dbo].[sales_orders]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_return_items_return_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_return_items_return_id] ON [dbo].[sales_return_items]
(
	[sales_return_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_returns_customer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_returns_customer_id] ON [dbo].[sales_returns]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_sales_returns_date]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_sales_returns_date] ON [dbo].[sales_returns]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_movements_created_at]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_movements_created_at] ON [dbo].[stock_movements]
(
	[created_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_movements_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_movements_item_id] ON [dbo].[stock_movements]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_transfer_items_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_transfer_items_item_id] ON [dbo].[stock_transfer_items]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_transfer_items_transfer_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_transfer_items_transfer_id] ON [dbo].[stock_transfer_items]
(
	[transfer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_transfers_from_warehouse]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_transfers_from_warehouse] ON [dbo].[stock_transfers]
(
	[from_warehouse_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_stock_transfers_to_warehouse]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_stock_transfers_to_warehouse] ON [dbo].[stock_transfers]
(
	[to_warehouse_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_units_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_units_is_active] ON [dbo].[units]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_user_roles_user_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_user_roles_user_id] ON [dbo].[user_roles]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendor_contacts_is_primary]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendor_contacts_is_primary] ON [dbo].[vendor_contacts]
(
	[is_primary] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendor_contacts_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendor_contacts_vendor_id] ON [dbo].[vendor_contacts]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendor_credit_items_vendor_credit_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendor_credit_items_vendor_credit_id] ON [dbo].[vendor_credit_items]
(
	[vendor_credit_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendor_credits_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendor_credits_created_by] ON [dbo].[vendor_credits]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendor_credits_vendor_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendor_credits_vendor_id] ON [dbo].[vendor_credits]
(
	[vendor_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendors_created_by]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendors_created_by] ON [dbo].[vendors]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_vendors_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_vendors_is_active] ON [dbo].[vendors]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_warehouse_stock_item_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_warehouse_stock_item_id] ON [dbo].[warehouse_stock]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_warehouse_stock_warehouse_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_warehouse_stock_warehouse_id] ON [dbo].[warehouse_stock]
(
	[warehouse_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_warehouses_branch_id]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_warehouses_branch_id] ON [dbo].[warehouses]
(
	[branch_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_warehouses_is_active]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_warehouses_is_active] ON [dbo].[warehouses]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_workflows_trigger_event]    Script Date: 12-03-2026 15:49:48 ******/
CREATE NONCLUSTERED INDEX [IX_workflows_trigger_event] ON [dbo].[workflows]
(
	[trigger_event] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[account_groups] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[account_groups] ADD  DEFAULT ('debit') FOR [nature]
GO
ALTER TABLE [dbo].[account_groups] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[accounts] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[accounts] ADD  DEFAULT ((0)) FOR [is_system]
GO
ALTER TABLE [dbo].[accounts] ADD  DEFAULT ((0)) FOR [balance]
GO
ALTER TABLE [dbo].[accounts] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[accounts] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[activity_logs] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[activity_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[attachments] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[attachments] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[audit_trail] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[audit_trail] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[auth_audit_logs] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[auth_audit_logs] ADD  DEFAULT ((1)) FOR [success]
GO
ALTER TABLE [dbo].[auth_audit_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[auth_sessions] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[auth_sessions] ADD  DEFAULT (getdate()) FOR [issued_at]
GO
ALTER TABLE [dbo].[auth_sessions] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[automation_logs] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[automation_logs] ADD  DEFAULT ('success') FOR [status]
GO
ALTER TABLE [dbo].[automation_logs] ADD  DEFAULT (getdate()) FOR [executed_at]
GO
ALTER TABLE [dbo].[backups] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[backups] ADD  DEFAULT ('completed') FOR [status]
GO
ALTER TABLE [dbo].[backups] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_accounts] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[bank_accounts] ADD  DEFAULT ((0)) FOR [current_balance]
GO
ALTER TABLE [dbo].[bank_accounts] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[bank_accounts] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_accounts] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bank_reconciliation] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[bank_reconciliation] ADD  DEFAULT ((0)) FOR [statement_balance]
GO
ALTER TABLE [dbo].[bank_reconciliation] ADD  DEFAULT ((0)) FOR [reconciled_balance]
GO
ALTER TABLE [dbo].[bank_reconciliation] ADD  DEFAULT ('in_progress') FOR [status]
GO
ALTER TABLE [dbo].[bank_reconciliation] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT ('debit') FOR [type]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT ((0)) FOR [is_reconciled]
GO
ALTER TABLE [dbo].[bank_transactions] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[bill_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT ((0)) FOR [balance_due]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bills] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[branches] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[branches] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[branches] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT ((4)) FOR [financial_year_start]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT ('INR') FOR [currency]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[companies] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[credit_note_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[credit_notes] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[customer_contacts] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[customer_contacts] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[customer_contacts] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((0)) FOR [credit_limit]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((0)) FOR [outstanding_balance]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[customers] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  CONSTRAINT [DF_delivery_challan_items_rate]  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  CONSTRAINT [DF_delivery_challan_items_tax_amount]  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[delivery_challan_items] ADD  CONSTRAINT [DF_delivery_challan_items_amount]  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  CONSTRAINT [DF_delivery_challans_subtotal]  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  CONSTRAINT [DF_delivery_challans_tax_amount]  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[delivery_challans] ADD  CONSTRAINT [DF_delivery_challans_total]  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[document_sequences] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[document_sequences] ADD  DEFAULT ((1)) FOR [next_number]
GO
ALTER TABLE [dbo].[document_sequences] ADD  DEFAULT ((4)) FOR [padding]
GO
ALTER TABLE [dbo].[e_invoice_records] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[e_invoice_records] ADD  DEFAULT ('pending') FOR [status]
GO
ALTER TABLE [dbo].[e_invoice_records] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[e_way_bills] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[e_way_bills] ADD  DEFAULT ((0)) FOR [distance_km]
GO
ALTER TABLE [dbo].[e_way_bills] ADD  DEFAULT ('pending') FOR [status]
GO
ALTER TABLE [dbo].[e_way_bills] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[email_logs] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[email_logs] ADD  DEFAULT ('sent') FOR [status]
GO
ALTER TABLE [dbo].[email_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[email_settings] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[email_settings] ADD  DEFAULT ((587)) FOR [smtp_port]
GO
ALTER TABLE [dbo].[email_settings] ADD  DEFAULT ((0)) FOR [is_active]
GO
ALTER TABLE [dbo].[email_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[expense_categories] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[expense_categories] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[expense_categories] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT ('cash') FOR [payment_mode]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT ((0)) FOR [is_recurring]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[expenses] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[financial_periods] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[financial_periods] ADD  DEFAULT ((0)) FOR [is_closed]
GO
ALTER TABLE [dbo].[financial_periods] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[gst_returns] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[gst_returns] ADD  DEFAULT ('pending') FOR [status]
GO
ALTER TABLE [dbo].[gst_returns] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT ((0)) FOR [is_composition]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT ((0)) FOR [reverse_charge_applicable]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT ((0)) FOR [einvoice_enabled]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT ((0)) FOR [eway_bill_enabled]
GO
ALTER TABLE [dbo].[gst_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[inventory_adjustment_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[inventory_adjustment_items] ADD  DEFAULT ((0)) FOR [quantity_on_hand]
GO
ALTER TABLE [dbo].[inventory_adjustment_items] ADD  DEFAULT ((0)) FOR [adjusted_quantity]
GO
ALTER TABLE [dbo].[inventory_adjustment_items] ADD  DEFAULT ((0)) FOR [difference]
GO
ALTER TABLE [dbo].[inventory_adjustment_items] ADD  DEFAULT ((0)) FOR [cost_price]
GO
ALTER TABLE [dbo].[inventory_adjustments] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[inventory_adjustments] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[inventory_adjustments] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[inventory_adjustments] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[inventory_adjustments] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[invoice_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT ('modern') FOR [template_id]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT ((1)) FOR [show_logo]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT ((1)) FOR [show_signature]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT ('Thank you for your business!') FOR [footer_text]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT ('#3b82f6') FOR [accent_color]
GO
ALTER TABLE [dbo].[invoice_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ((0)) FOR [balance_due]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[item_categories] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[item_categories] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ('pcs') FOR [unit]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((0)) FOR [purchase_rate]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((0)) FOR [selling_rate]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((0)) FOR [opening_stock]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((0)) FOR [current_stock]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((10)) FOR [reorder_level]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[items] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[journal_entries] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[journal_entries] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[journal_entries] ADD  DEFAULT ('manual') FOR [journal_type]
GO
ALTER TABLE [dbo].[journal_entries] ADD  DEFAULT ((0)) FOR [is_auto]
GO
ALTER TABLE [dbo].[journal_entries] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[journal_entry_lines] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[journal_entry_lines] ADD  DEFAULT ((0)) FOR [debit]
GO
ALTER TABLE [dbo].[journal_entry_lines] ADD  DEFAULT ((0)) FOR [credit]
GO
ALTER TABLE [dbo].[module_settings] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[module_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT ('info') FOR [type]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [is_read]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[password_resets] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[password_resets] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_allocations] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[payment_allocations] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[payment_allocations] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_made_allocations] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[payment_made_allocations] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[payment_made_allocations] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payments_made] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[payments_made] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[payments_made] ADD  DEFAULT ('bank_transfer') FOR [payment_mode]
GO
ALTER TABLE [dbo].[payments_made] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payments_received] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[payments_received] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[payments_received] ADD  DEFAULT ('cash') FOR [payment_mode]
GO
ALTER TABLE [dbo].[payments_received] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT ((0)) FOR [discount]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[pos_order_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT ((0)) FOR [discount]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT ('completed') FOR [status]
GO
ALTER TABLE [dbo].[pos_orders] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pos_payments] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[pos_payments] ADD  DEFAULT ('cash') FOR [payment_mode]
GO
ALTER TABLE [dbo].[pos_payments] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[pos_payments] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT (getdate()) FOR [opened_at]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ((0)) FOR [opening_balance]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ((0)) FOR [total_sales]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ((0)) FOR [total_cash]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ((0)) FOR [total_upi]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ((0)) FOR [total_card]
GO
ALTER TABLE [dbo].[pos_sessions] ADD  DEFAULT ('open') FOR [status]
GO
ALTER TABLE [dbo].[price_list_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[price_list_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[price_list_items] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[price_lists] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[price_lists] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[price_lists] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[price_lists] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[profiles] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[profiles] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[profiles] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[purchase_order_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[purchase_orders] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[purchase_return_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[purchase_returns] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[quotation_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[quotations] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT ('monthly') FOR [frequency]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT (CONVERT([date],getdate())) FOR [start_date]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[recurring_bills] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT ('monthly') FOR [frequency]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT (CONVERT([date],getdate())) FOR [start_date]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[recurring_invoices] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[report_cache] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[report_cache] ADD  DEFAULT (getdate()) FOR [generated_at]
GO
ALTER TABLE [dbo].[report_templates] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[report_templates] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[report_templates] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[sales_order_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT ('confirmed') FOR [status]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[sales_orders] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[sales_return_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[sales_returns] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[saved_reports] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[saved_reports] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[stock_movements] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[stock_movements] ADD  DEFAULT ((0)) FOR [cost_price]
GO
ALTER TABLE [dbo].[stock_movements] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[stock_transfer_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[stock_transfer_items] ADD  DEFAULT ((0)) FOR [quantity]
GO
ALTER TABLE [dbo].[stock_transfers] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[stock_transfers] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[stock_transfers] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[stock_transfers] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[system_settings] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[system_settings] ADD  DEFAULT ('general') FOR [category]
GO
ALTER TABLE [dbo].[system_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[tax_groups] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[tax_groups] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT ((0)) FOR [cgst]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT ((0)) FOR [sgst]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT ((0)) FOR [igst]
GO
ALTER TABLE [dbo].[tax_rates] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[units] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[units] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[units] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_roles] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[user_roles] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[vendor_contacts] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[vendor_contacts] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[vendor_contacts] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT ((1)) FOR [quantity]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT ((0)) FOR [rate]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[vendor_credit_items] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT (CONVERT([date],getdate())) FOR [date]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT ('draft') FOR [status]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT ((0)) FOR [total]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[vendor_credits] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[vendors] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[vendors] ADD  DEFAULT ((0)) FOR [outstanding_balance]
GO
ALTER TABLE [dbo].[vendors] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[vendors] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[vendors] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[warehouse_stock] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[warehouse_stock] ADD  DEFAULT ((0)) FOR [quantity]
GO
ALTER TABLE [dbo].[warehouse_stock] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[warehouses] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[warehouses] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[warehouses] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[workflow_actions] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[workflow_actions] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[workflow_logs] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[workflow_logs] ADD  DEFAULT ('success') FOR [status]
GO
ALTER TABLE [dbo].[workflow_logs] ADD  DEFAULT (getdate()) FOR [executed_at]
GO
ALTER TABLE [dbo].[workflows] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[workflows] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[workflows] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[account_groups]  WITH CHECK ADD  CONSTRAINT [FK_account_groups_parent] FOREIGN KEY([parent_id])
REFERENCES [dbo].[account_groups] ([id])
GO
ALTER TABLE [dbo].[account_groups] CHECK CONSTRAINT [FK_account_groups_parent]
GO
ALTER TABLE [dbo].[accounts]  WITH CHECK ADD  CONSTRAINT [FK_accounts_parent] FOREIGN KEY([parent_id])
REFERENCES [dbo].[accounts] ([id])
GO
ALTER TABLE [dbo].[accounts] CHECK CONSTRAINT [FK_accounts_parent]
GO
ALTER TABLE [dbo].[audit_trail]  WITH CHECK ADD  CONSTRAINT [FK_audit_trail_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[audit_trail] CHECK CONSTRAINT [FK_audit_trail_user]
GO
ALTER TABLE [dbo].[auth_audit_logs]  WITH CHECK ADD  CONSTRAINT [FK_auth_audit_logs_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[auth_audit_logs] CHECK CONSTRAINT [FK_auth_audit_logs_users]
GO
ALTER TABLE [dbo].[auth_sessions]  WITH CHECK ADD  CONSTRAINT [FK_auth_sessions_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[auth_sessions] CHECK CONSTRAINT [FK_auth_sessions_users]
GO
ALTER TABLE [dbo].[automation_logs]  WITH CHECK ADD  CONSTRAINT [FK_automation_logs_workflows] FOREIGN KEY([workflow_id])
REFERENCES [dbo].[workflows] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[automation_logs] CHECK CONSTRAINT [FK_automation_logs_workflows]
GO
ALTER TABLE [dbo].[bank_accounts]  WITH CHECK ADD  CONSTRAINT [FK_bank_accounts_account] FOREIGN KEY([account_id])
REFERENCES [dbo].[accounts] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[bank_accounts] CHECK CONSTRAINT [FK_bank_accounts_account]
GO
ALTER TABLE [dbo].[bank_reconciliation]  WITH CHECK ADD  CONSTRAINT [FK_bank_reconciliation_account] FOREIGN KEY([bank_account_id])
REFERENCES [dbo].[bank_accounts] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[bank_reconciliation] CHECK CONSTRAINT [FK_bank_reconciliation_account]
GO
ALTER TABLE [dbo].[bank_transactions]  WITH CHECK ADD  CONSTRAINT [FK_bank_transactions_account] FOREIGN KEY([bank_account_id])
REFERENCES [dbo].[bank_accounts] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[bank_transactions] CHECK CONSTRAINT [FK_bank_transactions_account]
GO
ALTER TABLE [dbo].[bill_items]  WITH CHECK ADD  CONSTRAINT [FK_bill_items_bill] FOREIGN KEY([bill_id])
REFERENCES [dbo].[bills] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[bill_items] CHECK CONSTRAINT [FK_bill_items_bill]
GO
ALTER TABLE [dbo].[bill_items]  WITH CHECK ADD  CONSTRAINT [FK_bill_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[bill_items] CHECK CONSTRAINT [FK_bill_items_item]
GO
ALTER TABLE [dbo].[bill_items]  WITH CHECK ADD  CONSTRAINT [FK_bill_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[bill_items] CHECK CONSTRAINT [FK_bill_items_tax_rate]
GO
ALTER TABLE [dbo].[bills]  WITH CHECK ADD  CONSTRAINT [FK_bills_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[bills] CHECK CONSTRAINT [FK_bills_created_by]
GO
ALTER TABLE [dbo].[bills]  WITH CHECK ADD  CONSTRAINT [FK_bills_purchase_order] FOREIGN KEY([purchase_order_id])
REFERENCES [dbo].[purchase_orders] ([id])
GO
ALTER TABLE [dbo].[bills] CHECK CONSTRAINT [FK_bills_purchase_order]
GO
ALTER TABLE [dbo].[bills]  WITH CHECK ADD  CONSTRAINT [FK_bills_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
GO
ALTER TABLE [dbo].[bills] CHECK CONSTRAINT [FK_bills_vendor]
GO
ALTER TABLE [dbo].[branches]  WITH CHECK ADD  CONSTRAINT [FK_branches_company] FOREIGN KEY([company_id])
REFERENCES [dbo].[companies] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[branches] CHECK CONSTRAINT [FK_branches_company]
GO
ALTER TABLE [dbo].[credit_note_items]  WITH CHECK ADD  CONSTRAINT [FK_cn_items_credit_note] FOREIGN KEY([credit_note_id])
REFERENCES [dbo].[credit_notes] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[credit_note_items] CHECK CONSTRAINT [FK_cn_items_credit_note]
GO
ALTER TABLE [dbo].[credit_note_items]  WITH CHECK ADD  CONSTRAINT [FK_cn_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[credit_note_items] CHECK CONSTRAINT [FK_cn_items_item]
GO
ALTER TABLE [dbo].[credit_note_items]  WITH CHECK ADD  CONSTRAINT [FK_cn_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[credit_note_items] CHECK CONSTRAINT [FK_cn_items_tax_rate]
GO
ALTER TABLE [dbo].[credit_notes]  WITH CHECK ADD  CONSTRAINT [FK_credit_notes_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[credit_notes] CHECK CONSTRAINT [FK_credit_notes_created_by]
GO
ALTER TABLE [dbo].[credit_notes]  WITH CHECK ADD  CONSTRAINT [FK_credit_notes_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[credit_notes] CHECK CONSTRAINT [FK_credit_notes_customer]
GO
ALTER TABLE [dbo].[credit_notes]  WITH CHECK ADD  CONSTRAINT [FK_credit_notes_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
GO
ALTER TABLE [dbo].[credit_notes] CHECK CONSTRAINT [FK_credit_notes_invoice]
GO
ALTER TABLE [dbo].[customer_contacts]  WITH CHECK ADD  CONSTRAINT [FK_customer_contacts_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[customer_contacts] CHECK CONSTRAINT [FK_customer_contacts_customer]
GO
ALTER TABLE [dbo].[customers]  WITH CHECK ADD  CONSTRAINT [FK_customers_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[customers] CHECK CONSTRAINT [FK_customers_created_by]
GO
ALTER TABLE [dbo].[delivery_challan_items]  WITH CHECK ADD  CONSTRAINT [FK_dc_items_delivery_challan] FOREIGN KEY([delivery_challan_id])
REFERENCES [dbo].[delivery_challans] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[delivery_challan_items] CHECK CONSTRAINT [FK_dc_items_delivery_challan]
GO
ALTER TABLE [dbo].[delivery_challan_items]  WITH CHECK ADD  CONSTRAINT [FK_dc_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[delivery_challan_items] CHECK CONSTRAINT [FK_dc_items_item]
GO
ALTER TABLE [dbo].[delivery_challans]  WITH CHECK ADD  CONSTRAINT [FK_delivery_challans_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[delivery_challans] CHECK CONSTRAINT [FK_delivery_challans_created_by]
GO
ALTER TABLE [dbo].[delivery_challans]  WITH CHECK ADD  CONSTRAINT [FK_delivery_challans_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[delivery_challans] CHECK CONSTRAINT [FK_delivery_challans_customer]
GO
ALTER TABLE [dbo].[delivery_challans]  WITH CHECK ADD  CONSTRAINT [FK_delivery_challans_sales_order] FOREIGN KEY([sales_order_id])
REFERENCES [dbo].[sales_orders] ([id])
GO
ALTER TABLE [dbo].[delivery_challans] CHECK CONSTRAINT [FK_delivery_challans_sales_order]
GO
ALTER TABLE [dbo].[e_invoice_records]  WITH CHECK ADD  CONSTRAINT [FK_e_invoice_records_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[e_invoice_records] CHECK CONSTRAINT [FK_e_invoice_records_invoice]
GO
ALTER TABLE [dbo].[e_way_bills]  WITH CHECK ADD  CONSTRAINT [FK_e_way_bills_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[e_way_bills] CHECK CONSTRAINT [FK_e_way_bills_invoice]
GO
ALTER TABLE [dbo].[expenses]  WITH CHECK ADD  CONSTRAINT [FK_expenses_account] FOREIGN KEY([account_id])
REFERENCES [dbo].[accounts] ([id])
GO
ALTER TABLE [dbo].[expenses] CHECK CONSTRAINT [FK_expenses_account]
GO
ALTER TABLE [dbo].[expenses]  WITH CHECK ADD  CONSTRAINT [FK_expenses_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[expenses] CHECK CONSTRAINT [FK_expenses_created_by]
GO
ALTER TABLE [dbo].[expenses]  WITH CHECK ADD  CONSTRAINT [FK_expenses_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
GO
ALTER TABLE [dbo].[expenses] CHECK CONSTRAINT [FK_expenses_vendor]
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD  CONSTRAINT [FK_inv_adj_items_adjustment] FOREIGN KEY([adjustment_id])
REFERENCES [dbo].[inventory_adjustments] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[inventory_adjustment_items] CHECK CONSTRAINT [FK_inv_adj_items_adjustment]
GO
ALTER TABLE [dbo].[inventory_adjustment_items]  WITH CHECK ADD  CONSTRAINT [FK_inv_adj_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[inventory_adjustment_items] CHECK CONSTRAINT [FK_inv_adj_items_item]
GO
ALTER TABLE [dbo].[inventory_adjustments]  WITH CHECK ADD  CONSTRAINT [FK_inventory_adjustments_warehouse] FOREIGN KEY([warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[inventory_adjustments] CHECK CONSTRAINT [FK_inventory_adjustments_warehouse]
GO
ALTER TABLE [dbo].[invoice_items]  WITH CHECK ADD  CONSTRAINT [FK_invoice_items_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[invoice_items] CHECK CONSTRAINT [FK_invoice_items_invoice]
GO
ALTER TABLE [dbo].[invoice_items]  WITH CHECK ADD  CONSTRAINT [FK_invoice_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[invoice_items] CHECK CONSTRAINT [FK_invoice_items_item]
GO
ALTER TABLE [dbo].[invoice_items]  WITH CHECK ADD  CONSTRAINT [FK_invoice_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[invoice_items] CHECK CONSTRAINT [FK_invoice_items_tax_rate]
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [FK_invoices_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [FK_invoices_created_by]
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [FK_invoices_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [FK_invoices_customer]
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [FK_invoices_sales_order] FOREIGN KEY([sales_order_id])
REFERENCES [dbo].[sales_orders] ([id])
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [FK_invoices_sales_order]
GO
ALTER TABLE [dbo].[item_categories]  WITH CHECK ADD  CONSTRAINT [FK_item_categories_parent] FOREIGN KEY([parent_id])
REFERENCES [dbo].[item_categories] ([id])
GO
ALTER TABLE [dbo].[item_categories] CHECK CONSTRAINT [FK_item_categories_parent]
GO
ALTER TABLE [dbo].[items]  WITH CHECK ADD  CONSTRAINT [FK_items_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[items] CHECK CONSTRAINT [FK_items_created_by]
GO
ALTER TABLE [dbo].[items]  WITH CHECK ADD  CONSTRAINT [FK_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[items] CHECK CONSTRAINT [FK_items_tax_rate]
GO
ALTER TABLE [dbo].[journal_entries]  WITH CHECK ADD  CONSTRAINT [FK_journal_entries_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[journal_entries] CHECK CONSTRAINT [FK_journal_entries_created_by]
GO
ALTER TABLE [dbo].[journal_entry_lines]  WITH CHECK ADD  CONSTRAINT [FK_jel_account] FOREIGN KEY([account_id])
REFERENCES [dbo].[accounts] ([id])
GO
ALTER TABLE [dbo].[journal_entry_lines] CHECK CONSTRAINT [FK_jel_account]
GO
ALTER TABLE [dbo].[journal_entry_lines]  WITH CHECK ADD  CONSTRAINT [FK_jel_journal_entry] FOREIGN KEY([journal_entry_id])
REFERENCES [dbo].[journal_entries] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[journal_entry_lines] CHECK CONSTRAINT [FK_jel_journal_entry]
GO
ALTER TABLE [dbo].[module_settings]  WITH CHECK ADD  CONSTRAINT [FK_module_settings_users] FOREIGN KEY([updated_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[module_settings] CHECK CONSTRAINT [FK_module_settings_users]
GO
ALTER TABLE [dbo].[password_resets]  WITH CHECK ADD  CONSTRAINT [FK_password_resets_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[password_resets] CHECK CONSTRAINT [FK_password_resets_users]
GO
ALTER TABLE [dbo].[payment_allocations]  WITH CHECK ADD  CONSTRAINT [FK_payment_allocations_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
GO
ALTER TABLE [dbo].[payment_allocations] CHECK CONSTRAINT [FK_payment_allocations_invoice]
GO
ALTER TABLE [dbo].[payment_allocations]  WITH CHECK ADD  CONSTRAINT [FK_payment_allocations_payment] FOREIGN KEY([payment_id])
REFERENCES [dbo].[payments_received] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[payment_allocations] CHECK CONSTRAINT [FK_payment_allocations_payment]
GO
ALTER TABLE [dbo].[payment_made_allocations]  WITH CHECK ADD  CONSTRAINT [FK_payment_made_allocations_bill] FOREIGN KEY([bill_id])
REFERENCES [dbo].[bills] ([id])
GO
ALTER TABLE [dbo].[payment_made_allocations] CHECK CONSTRAINT [FK_payment_made_allocations_bill]
GO
ALTER TABLE [dbo].[payment_made_allocations]  WITH CHECK ADD  CONSTRAINT [FK_payment_made_allocations_payment] FOREIGN KEY([payment_id])
REFERENCES [dbo].[payments_made] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[payment_made_allocations] CHECK CONSTRAINT [FK_payment_made_allocations_payment]
GO
ALTER TABLE [dbo].[payments_made]  WITH CHECK ADD  CONSTRAINT [FK_payments_made_bill] FOREIGN KEY([bill_id])
REFERENCES [dbo].[bills] ([id])
GO
ALTER TABLE [dbo].[payments_made] CHECK CONSTRAINT [FK_payments_made_bill]
GO
ALTER TABLE [dbo].[payments_made]  WITH CHECK ADD  CONSTRAINT [FK_payments_made_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[payments_made] CHECK CONSTRAINT [FK_payments_made_created_by]
GO
ALTER TABLE [dbo].[payments_made]  WITH CHECK ADD  CONSTRAINT [FK_payments_made_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
GO
ALTER TABLE [dbo].[payments_made] CHECK CONSTRAINT [FK_payments_made_vendor]
GO
ALTER TABLE [dbo].[payments_received]  WITH CHECK ADD  CONSTRAINT [FK_payments_received_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[payments_received] CHECK CONSTRAINT [FK_payments_received_created_by]
GO
ALTER TABLE [dbo].[payments_received]  WITH CHECK ADD  CONSTRAINT [FK_payments_received_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[payments_received] CHECK CONSTRAINT [FK_payments_received_customer]
GO
ALTER TABLE [dbo].[payments_received]  WITH CHECK ADD  CONSTRAINT [FK_payments_received_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
GO
ALTER TABLE [dbo].[payments_received] CHECK CONSTRAINT [FK_payments_received_invoice]
GO
ALTER TABLE [dbo].[pos_order_items]  WITH CHECK ADD  CONSTRAINT [FK_pos_order_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[pos_order_items] CHECK CONSTRAINT [FK_pos_order_items_item]
GO
ALTER TABLE [dbo].[pos_order_items]  WITH CHECK ADD  CONSTRAINT [FK_pos_order_items_order] FOREIGN KEY([order_id])
REFERENCES [dbo].[pos_orders] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pos_order_items] CHECK CONSTRAINT [FK_pos_order_items_order]
GO
ALTER TABLE [dbo].[pos_orders]  WITH CHECK ADD  CONSTRAINT [FK_pos_orders_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[pos_orders] CHECK CONSTRAINT [FK_pos_orders_customer]
GO
ALTER TABLE [dbo].[pos_orders]  WITH CHECK ADD  CONSTRAINT [FK_pos_orders_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[pos_orders] CHECK CONSTRAINT [FK_pos_orders_invoice]
GO
ALTER TABLE [dbo].[pos_orders]  WITH CHECK ADD  CONSTRAINT [FK_pos_orders_session] FOREIGN KEY([session_id])
REFERENCES [dbo].[pos_sessions] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[pos_orders] CHECK CONSTRAINT [FK_pos_orders_session]
GO
ALTER TABLE [dbo].[pos_payments]  WITH CHECK ADD  CONSTRAINT [FK_pos_payments_order] FOREIGN KEY([order_id])
REFERENCES [dbo].[pos_orders] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pos_payments] CHECK CONSTRAINT [FK_pos_payments_order]
GO
ALTER TABLE [dbo].[price_list_items]  WITH CHECK ADD  CONSTRAINT [FK_price_list_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[price_list_items] CHECK CONSTRAINT [FK_price_list_items_item]
GO
ALTER TABLE [dbo].[price_list_items]  WITH CHECK ADD  CONSTRAINT [FK_price_list_items_list] FOREIGN KEY([price_list_id])
REFERENCES [dbo].[price_lists] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[price_list_items] CHECK CONSTRAINT [FK_price_list_items_list]
GO
ALTER TABLE [dbo].[profiles]  WITH CHECK ADD  CONSTRAINT [FK_profiles_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[profiles] CHECK CONSTRAINT [FK_profiles_user]
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD  CONSTRAINT [FK_po_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items] CHECK CONSTRAINT [FK_po_items_item]
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD  CONSTRAINT [FK_po_items_purchase_order] FOREIGN KEY([purchase_order_id])
REFERENCES [dbo].[purchase_orders] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[purchase_order_items] CHECK CONSTRAINT [FK_po_items_purchase_order]
GO
ALTER TABLE [dbo].[purchase_order_items]  WITH CHECK ADD  CONSTRAINT [FK_po_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[purchase_order_items] CHECK CONSTRAINT [FK_po_items_tax_rate]
GO
ALTER TABLE [dbo].[purchase_orders]  WITH CHECK ADD  CONSTRAINT [FK_purchase_orders_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[purchase_orders] CHECK CONSTRAINT [FK_purchase_orders_created_by]
GO
ALTER TABLE [dbo].[purchase_orders]  WITH CHECK ADD  CONSTRAINT [FK_purchase_orders_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
GO
ALTER TABLE [dbo].[purchase_orders] CHECK CONSTRAINT [FK_purchase_orders_vendor]
GO
ALTER TABLE [dbo].[purchase_return_items]  WITH CHECK ADD  CONSTRAINT [FK_purchase_return_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[purchase_return_items] CHECK CONSTRAINT [FK_purchase_return_items_item]
GO
ALTER TABLE [dbo].[purchase_return_items]  WITH CHECK ADD  CONSTRAINT [FK_purchase_return_items_return] FOREIGN KEY([purchase_return_id])
REFERENCES [dbo].[purchase_returns] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[purchase_return_items] CHECK CONSTRAINT [FK_purchase_return_items_return]
GO
ALTER TABLE [dbo].[purchase_returns]  WITH CHECK ADD  CONSTRAINT [FK_purchase_returns_bill] FOREIGN KEY([bill_id])
REFERENCES [dbo].[bills] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[purchase_returns] CHECK CONSTRAINT [FK_purchase_returns_bill]
GO
ALTER TABLE [dbo].[purchase_returns]  WITH CHECK ADD  CONSTRAINT [FK_purchase_returns_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[purchase_returns] CHECK CONSTRAINT [FK_purchase_returns_vendor]
GO
ALTER TABLE [dbo].[quotation_items]  WITH CHECK ADD  CONSTRAINT [FK_quotation_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[quotation_items] CHECK CONSTRAINT [FK_quotation_items_item]
GO
ALTER TABLE [dbo].[quotation_items]  WITH CHECK ADD  CONSTRAINT [FK_quotation_items_quotation] FOREIGN KEY([quotation_id])
REFERENCES [dbo].[quotations] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[quotation_items] CHECK CONSTRAINT [FK_quotation_items_quotation]
GO
ALTER TABLE [dbo].[quotation_items]  WITH CHECK ADD  CONSTRAINT [FK_quotation_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[quotation_items] CHECK CONSTRAINT [FK_quotation_items_tax_rate]
GO
ALTER TABLE [dbo].[quotations]  WITH CHECK ADD  CONSTRAINT [FK_quotations_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[quotations] CHECK CONSTRAINT [FK_quotations_created_by]
GO
ALTER TABLE [dbo].[quotations]  WITH CHECK ADD  CONSTRAINT [FK_quotations_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[quotations] CHECK CONSTRAINT [FK_quotations_customer]
GO
ALTER TABLE [dbo].[recurring_bills]  WITH CHECK ADD  CONSTRAINT [FK_recurring_bills_base] FOREIGN KEY([base_bill_id])
REFERENCES [dbo].[bills] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[recurring_bills] CHECK CONSTRAINT [FK_recurring_bills_base]
GO
ALTER TABLE [dbo].[recurring_bills]  WITH CHECK ADD  CONSTRAINT [FK_recurring_bills_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[recurring_bills] CHECK CONSTRAINT [FK_recurring_bills_vendor]
GO
ALTER TABLE [dbo].[recurring_invoices]  WITH CHECK ADD  CONSTRAINT [FK_recurring_invoices_base] FOREIGN KEY([base_invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[recurring_invoices] CHECK CONSTRAINT [FK_recurring_invoices_base]
GO
ALTER TABLE [dbo].[recurring_invoices]  WITH CHECK ADD  CONSTRAINT [FK_recurring_invoices_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[recurring_invoices] CHECK CONSTRAINT [FK_recurring_invoices_customer]
GO
ALTER TABLE [dbo].[report_templates]  WITH CHECK ADD  CONSTRAINT [FK_report_templates_users] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[report_templates] CHECK CONSTRAINT [FK_report_templates_users]
GO
ALTER TABLE [dbo].[sales_order_items]  WITH CHECK ADD  CONSTRAINT [FK_so_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[sales_order_items] CHECK CONSTRAINT [FK_so_items_item]
GO
ALTER TABLE [dbo].[sales_order_items]  WITH CHECK ADD  CONSTRAINT [FK_so_items_sales_order] FOREIGN KEY([sales_order_id])
REFERENCES [dbo].[sales_orders] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[sales_order_items] CHECK CONSTRAINT [FK_so_items_sales_order]
GO
ALTER TABLE [dbo].[sales_order_items]  WITH CHECK ADD  CONSTRAINT [FK_so_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[sales_order_items] CHECK CONSTRAINT [FK_so_items_tax_rate]
GO
ALTER TABLE [dbo].[sales_orders]  WITH CHECK ADD  CONSTRAINT [FK_sales_orders_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[sales_orders] CHECK CONSTRAINT [FK_sales_orders_created_by]
GO
ALTER TABLE [dbo].[sales_orders]  WITH CHECK ADD  CONSTRAINT [FK_sales_orders_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
GO
ALTER TABLE [dbo].[sales_orders] CHECK CONSTRAINT [FK_sales_orders_customer]
GO
ALTER TABLE [dbo].[sales_orders]  WITH CHECK ADD  CONSTRAINT [FK_sales_orders_quotation] FOREIGN KEY([quotation_id])
REFERENCES [dbo].[quotations] ([id])
GO
ALTER TABLE [dbo].[sales_orders] CHECK CONSTRAINT [FK_sales_orders_quotation]
GO
ALTER TABLE [dbo].[sales_return_items]  WITH CHECK ADD  CONSTRAINT [FK_sales_return_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[sales_return_items] CHECK CONSTRAINT [FK_sales_return_items_item]
GO
ALTER TABLE [dbo].[sales_return_items]  WITH CHECK ADD  CONSTRAINT [FK_sales_return_items_return] FOREIGN KEY([sales_return_id])
REFERENCES [dbo].[sales_returns] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[sales_return_items] CHECK CONSTRAINT [FK_sales_return_items_return]
GO
ALTER TABLE [dbo].[sales_returns]  WITH CHECK ADD  CONSTRAINT [FK_sales_returns_customer] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[sales_returns] CHECK CONSTRAINT [FK_sales_returns_customer]
GO
ALTER TABLE [dbo].[sales_returns]  WITH CHECK ADD  CONSTRAINT [FK_sales_returns_invoice] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[sales_returns] CHECK CONSTRAINT [FK_sales_returns_invoice]
GO
ALTER TABLE [dbo].[saved_reports]  WITH CHECK ADD  CONSTRAINT [FK_saved_reports_templates] FOREIGN KEY([template_id])
REFERENCES [dbo].[report_templates] ([id])
GO
ALTER TABLE [dbo].[saved_reports] CHECK CONSTRAINT [FK_saved_reports_templates]
GO
ALTER TABLE [dbo].[saved_reports]  WITH CHECK ADD  CONSTRAINT [FK_saved_reports_users] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[saved_reports] CHECK CONSTRAINT [FK_saved_reports_users]
GO
ALTER TABLE [dbo].[stock_movements]  WITH CHECK ADD  CONSTRAINT [FK_stock_movements_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[stock_movements] CHECK CONSTRAINT [FK_stock_movements_created_by]
GO
ALTER TABLE [dbo].[stock_movements]  WITH CHECK ADD  CONSTRAINT [FK_stock_movements_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[stock_movements] CHECK CONSTRAINT [FK_stock_movements_item]
GO
ALTER TABLE [dbo].[stock_transfer_items]  WITH CHECK ADD  CONSTRAINT [FK_stock_transfer_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[stock_transfer_items] CHECK CONSTRAINT [FK_stock_transfer_items_item]
GO
ALTER TABLE [dbo].[stock_transfer_items]  WITH CHECK ADD  CONSTRAINT [FK_stock_transfer_items_transfer] FOREIGN KEY([transfer_id])
REFERENCES [dbo].[stock_transfers] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[stock_transfer_items] CHECK CONSTRAINT [FK_stock_transfer_items_transfer]
GO
ALTER TABLE [dbo].[stock_transfers]  WITH CHECK ADD  CONSTRAINT [FK_stock_transfers_from_warehouse] FOREIGN KEY([from_warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[stock_transfers] CHECK CONSTRAINT [FK_stock_transfers_from_warehouse]
GO
ALTER TABLE [dbo].[stock_transfers]  WITH CHECK ADD  CONSTRAINT [FK_stock_transfers_to_warehouse] FOREIGN KEY([to_warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
GO
ALTER TABLE [dbo].[stock_transfers] CHECK CONSTRAINT [FK_stock_transfers_to_warehouse]
GO
ALTER TABLE [dbo].[user_roles]  WITH CHECK ADD  CONSTRAINT [FK_user_roles_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_roles] CHECK CONSTRAINT [FK_user_roles_user]
GO
ALTER TABLE [dbo].[vendor_contacts]  WITH CHECK ADD  CONSTRAINT [FK_vendor_contacts_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[vendor_contacts] CHECK CONSTRAINT [FK_vendor_contacts_vendor]
GO
ALTER TABLE [dbo].[vendor_credit_items]  WITH CHECK ADD  CONSTRAINT [FK_vc_items_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
GO
ALTER TABLE [dbo].[vendor_credit_items] CHECK CONSTRAINT [FK_vc_items_item]
GO
ALTER TABLE [dbo].[vendor_credit_items]  WITH CHECK ADD  CONSTRAINT [FK_vc_items_tax_rate] FOREIGN KEY([tax_rate_id])
REFERENCES [dbo].[tax_rates] ([id])
GO
ALTER TABLE [dbo].[vendor_credit_items] CHECK CONSTRAINT [FK_vc_items_tax_rate]
GO
ALTER TABLE [dbo].[vendor_credit_items]  WITH CHECK ADD  CONSTRAINT [FK_vc_items_vendor_credit] FOREIGN KEY([vendor_credit_id])
REFERENCES [dbo].[vendor_credits] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[vendor_credit_items] CHECK CONSTRAINT [FK_vc_items_vendor_credit]
GO
ALTER TABLE [dbo].[vendor_credits]  WITH CHECK ADD  CONSTRAINT [FK_vendor_credits_bill] FOREIGN KEY([bill_id])
REFERENCES [dbo].[bills] ([id])
GO
ALTER TABLE [dbo].[vendor_credits] CHECK CONSTRAINT [FK_vendor_credits_bill]
GO
ALTER TABLE [dbo].[vendor_credits]  WITH CHECK ADD  CONSTRAINT [FK_vendor_credits_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[vendor_credits] CHECK CONSTRAINT [FK_vendor_credits_created_by]
GO
ALTER TABLE [dbo].[vendor_credits]  WITH CHECK ADD  CONSTRAINT [FK_vendor_credits_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[vendors] ([id])
GO
ALTER TABLE [dbo].[vendor_credits] CHECK CONSTRAINT [FK_vendor_credits_vendor]
GO
ALTER TABLE [dbo].[vendors]  WITH CHECK ADD  CONSTRAINT [FK_vendors_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([id])
GO
ALTER TABLE [dbo].[vendors] CHECK CONSTRAINT [FK_vendors_created_by]
GO
ALTER TABLE [dbo].[warehouse_stock]  WITH CHECK ADD  CONSTRAINT [FK_warehouse_stock_item] FOREIGN KEY([item_id])
REFERENCES [dbo].[items] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[warehouse_stock] CHECK CONSTRAINT [FK_warehouse_stock_item]
GO
ALTER TABLE [dbo].[warehouse_stock]  WITH CHECK ADD  CONSTRAINT [FK_warehouse_stock_warehouse] FOREIGN KEY([warehouse_id])
REFERENCES [dbo].[warehouses] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[warehouse_stock] CHECK CONSTRAINT [FK_warehouse_stock_warehouse]
GO
ALTER TABLE [dbo].[warehouses]  WITH CHECK ADD  CONSTRAINT [FK_warehouses_branch] FOREIGN KEY([branch_id])
REFERENCES [dbo].[branches] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[warehouses] CHECK CONSTRAINT [FK_warehouses_branch]
GO
ALTER TABLE [dbo].[workflow_actions]  WITH CHECK ADD  CONSTRAINT [FK_workflow_actions_workflow] FOREIGN KEY([workflow_id])
REFERENCES [dbo].[workflows] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[workflow_actions] CHECK CONSTRAINT [FK_workflow_actions_workflow]
GO
ALTER TABLE [dbo].[workflow_logs]  WITH CHECK ADD  CONSTRAINT [FK_workflow_logs_workflow] FOREIGN KEY([workflow_id])
REFERENCES [dbo].[workflows] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[workflow_logs] CHECK CONSTRAINT [FK_workflow_logs_workflow]
GO
ALTER TABLE [dbo].[accounts]  WITH CHECK ADD  CONSTRAINT [CK_account_type] CHECK  (([account_type]='expense' OR [account_type]='income' OR [account_type]='equity' OR [account_type]='liability' OR [account_type]='asset'))
GO
ALTER TABLE [dbo].[accounts] CHECK CONSTRAINT [CK_account_type]
GO
ALTER TABLE [dbo].[audit_trail]  WITH CHECK ADD  CONSTRAINT [CK_audit_action] CHECK  (([action]='delete' OR [action]='update' OR [action]='create'))
GO
ALTER TABLE [dbo].[audit_trail] CHECK CONSTRAINT [CK_audit_action]
GO
ALTER TABLE [dbo].[bank_transactions]  WITH CHECK ADD  CONSTRAINT [CK_bank_transaction_type] CHECK  (([type]='credit' OR [type]='debit'))
GO
ALTER TABLE [dbo].[bank_transactions] CHECK CONSTRAINT [CK_bank_transaction_type]
GO
ALTER TABLE [dbo].[expenses]  WITH CHECK ADD  CONSTRAINT [CK_recurring_frequency] CHECK  (([recurring_frequency]='yearly' OR [recurring_frequency]='monthly' OR [recurring_frequency]='weekly' OR [recurring_frequency]='daily'))
GO
ALTER TABLE [dbo].[expenses] CHECK CONSTRAINT [CK_recurring_frequency]
GO
ALTER TABLE [dbo].[payments_made]  WITH CHECK ADD  CONSTRAINT [CK_payment_mode_made] CHECK  (([payment_mode]='other' OR [payment_mode]='card' OR [payment_mode]='cheque' OR [payment_mode]='upi' OR [payment_mode]='bank_transfer' OR [payment_mode]='cash'))
GO
ALTER TABLE [dbo].[payments_made] CHECK CONSTRAINT [CK_payment_mode_made]
GO
ALTER TABLE [dbo].[payments_received]  WITH CHECK ADD  CONSTRAINT [CK_payment_mode_received] CHECK  (([payment_mode]='other' OR [payment_mode]='card' OR [payment_mode]='cheque' OR [payment_mode]='upi' OR [payment_mode]='bank_transfer' OR [payment_mode]='cash'))
GO
ALTER TABLE [dbo].[payments_received] CHECK CONSTRAINT [CK_payment_mode_received]
GO
ALTER TABLE [dbo].[pos_payments]  WITH CHECK ADD  CONSTRAINT [CK_pos_payment_mode] CHECK  (([payment_mode]='mix' OR [payment_mode]='card' OR [payment_mode]='upi' OR [payment_mode]='cash'))
GO
ALTER TABLE [dbo].[pos_payments] CHECK CONSTRAINT [CK_pos_payment_mode]
GO
ALTER TABLE [dbo].[tax_rates]  WITH CHECK ADD  CONSTRAINT [CK_tax_type] CHECK  (([tax_type]='exempt' OR [tax_type]='IGST' OR [tax_type]='GST' OR [tax_type]='composite' OR [tax_type]='cess' OR [tax_type]='igst' OR [tax_type]='sgst' OR [tax_type]='cgst'))
GO
ALTER TABLE [dbo].[tax_rates] CHECK CONSTRAINT [CK_tax_type]
GO
/****** Object:  StoredProcedure [dbo].[sp_GenerateDocumentNumber]    Script Date: 12-03-2026 15:49:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- STORED PROCEDURE FOR DOCUMENT NUMBER GENERATION
-- =============================================

CREATE PROCEDURE [dbo].[sp_GenerateDocumentNumber]
    @DocumentType NVARCHAR(50),
    @NewDocumentNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Prefix NVARCHAR(20);
    DECLARE @NextNumber INT;
    DECLARE @Padding INT;
    DECLARE @FinancialYear NVARCHAR(20);
    
    -- Get or create sequence for document type
    IF NOT EXISTS (SELECT 1 FROM dbo.document_sequences WHERE document_type = @DocumentType)
    BEGIN
        INSERT INTO dbo.document_sequences (document_type, prefix, next_number, padding)
        VALUES (@DocumentType, 
                CASE @DocumentType 
                    WHEN 'QUOTATION' THEN 'Q'
                    WHEN 'SALES_ORDER' THEN 'SO'
                    WHEN 'DELIVERY_CHALLAN' THEN 'DC'
                    WHEN 'INVOICE' THEN 'INV'
                    WHEN 'CREDIT_NOTE' THEN 'CN'
                    WHEN 'PURCHASE_ORDER' THEN 'PO'
                    WHEN 'BILL' THEN 'BIL'
                    WHEN 'VENDOR_CREDIT' THEN 'VC'
                    WHEN 'PAYMENT_RECEIVED' THEN 'PR'
                    WHEN 'PAYMENT_MADE' THEN 'PM'
                    WHEN 'JOURNAL' THEN 'JV'
                    ELSE LEFT(@DocumentType, 3)
                END,
                1, 6);
    END
    
    -- Get current sequence values
    SELECT @Prefix = prefix, @NextNumber = next_number, @Padding = padding
    FROM dbo.document_sequences
    WHERE document_type = @DocumentType;
    
    -- Generate document number
    SET @NewDocumentNumber = @Prefix + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(10)), @Padding);
    
    -- Update next number
    UPDATE dbo.document_sequences
    SET next_number = next_number + 1
    WHERE document_type = @DocumentType;
END
GO
/****** Object:  StoredProcedure [dbo].[sp_UpdateStock]    Script Date: 12-03-2026 15:49:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- STORED PROCEDURE FOR STOCK UPDATE
-- =============================================

CREATE PROCEDURE [dbo].[sp_UpdateStock]
    @ItemId UNIQUEIDENTIFIER,
    @Quantity DECIMAL(15,2),
    @MovementType VARCHAR(30),
    @ReferenceId UNIQUEIDENTIFIER = NULL,
    @ReferenceType NVARCHAR(100) = NULL,
    @CostPrice DECIMAL(15,2) = 0,
    @UserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Update item stock
        IF @MovementType IN ('PURCHASE', 'RECEIPT', 'RETURN_IN')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock + @Quantity
            WHERE id = @ItemId;
        END
        ELSE IF @MovementType IN ('SALE', 'ISSUE', 'RETURN_OUT', 'ADJUSTMENT_MINUS')
        BEGIN
            UPDATE dbo.items
            SET current_stock = current_stock - @Quantity
            WHERE id = @ItemId;
        END
        
        -- Record stock movement
        INSERT INTO dbo.stock_movements (
            item_id, movement_type, quantity, cost_price, 
            reference_id, reference_type, notes, created_by, created_at
        )
        VALUES (
            @ItemId, @MovementType, @Quantity, @CostPrice,
            @ReferenceId, @ReferenceType, 
            'Stock ' + @MovementType + ' of ' + CAST(@Quantity AS NVARCHAR(20)),
            @UserId, GETDATE()
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
USE [master]
GO
ALTER DATABASE [billing_application] SET  READ_WRITE 
GO
