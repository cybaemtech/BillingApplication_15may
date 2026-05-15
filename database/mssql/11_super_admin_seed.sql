USE [billing_application];
GO

PRINT 'Ensuring CybaemTech super admin user exists';
GO

DECLARE @email NVARCHAR(255) = N'ganesh@gmail.com';
DECLARE @password_hash NVARCHAR(255) = N'$2b$10$AO6WJsb3cQbphtV3S8jcg.ozB4xZU1K1aTt9hmEHi86fiiLw5hY5W';
DECLARE @user_id UNIQUEIDENTIFIER;

SELECT TOP 1 @user_id = id
FROM dbo.users
WHERE email = @email;

IF @user_id IS NULL
BEGIN
  SET @user_id = NEWID();

  INSERT INTO dbo.users (id, username, email, password_hash, is_active, created_at, updated_at, role)
  VALUES (@user_id, N'ganesh', @email, @password_hash, 1, GETDATE(), GETDATE(), N'admin');
END
ELSE
BEGIN
  UPDATE dbo.users
  SET username = N'ganesh',
      password_hash = @password_hash,
      is_active = 1,
      updated_at = GETDATE(),
      role = N'admin'
  WHERE id = @user_id;
END
GO

IF OBJECT_ID(N'dbo.profiles', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.profiles WHERE user_id = @user_id)
BEGIN
  INSERT INTO dbo.profiles (id, user_id, display_name, email, created_at, updated_at)
  VALUES (NEWID(), @user_id, N'Ganesh Super Admin', @email, GETDATE(), GETDATE());
END
GO

PRINT 'CybaemTech super admin user is ready';
GO
