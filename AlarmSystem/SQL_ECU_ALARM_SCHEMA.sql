-- ECU + Alarm schema for SQL Server
-- Run on AlarmSystemHMI database

IF OBJECT_ID('dbo.ECU', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ECU
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL UNIQUE
    );
END
GO

IF OBJECT_ID('dbo.Alarm', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Alarm
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL,
        Message NVARCHAR(250) NOT NULL,
        Severity NVARCHAR(20) NOT NULL,
        ECUId INT NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT('Inactive'),
        IsAcknowledged BIT NOT NULL DEFAULT(1),
        TriggeredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        AcknowledgedAt DATETIME2 NULL,
        CONSTRAINT FK_Alarm_ECU FOREIGN KEY (ECUId) REFERENCES dbo.ECU(Id)
    );
END
GO

-- Seed exactly 21 ECUs
IF NOT EXISTS (SELECT 1 FROM dbo.ECU)
BEGIN
    DECLARE @i INT = 1;
    WHILE @i <= 21
    BEGIN
        INSERT INTO dbo.ECU(Name) VALUES (CONCAT('ECU-', RIGHT(CONCAT('0', @i), 2)));
        SET @i += 1;
    END
END
GO

-- Seed one inactive alarm per ECU (21 total)
IF NOT EXISTS (SELECT 1 FROM dbo.Alarm)
BEGIN
    INSERT INTO dbo.Alarm(Code, Message, Severity, ECUId, Status, IsAcknowledged, TriggeredAt, AcknowledgedAt)
    SELECT
        CONCAT('ECU', RIGHT(CONCAT('0', e.Id), 2), '_ALM'),
        CONCAT('Default alarm for ', e.Name),
        CASE (e.Id % 4)
            WHEN 0 THEN 'Critical'
            WHEN 1 THEN 'High'
            WHEN 2 THEN 'Medium'
            ELSE 'Low'
        END,
        e.Id,
        'Inactive',
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    FROM dbo.ECU e;
END
GO

-- Verification
SELECT COUNT(*) AS TotalEcus FROM dbo.ECU;
SELECT COUNT(*) AS TotalAlarms,
       SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS ActiveAlarms
FROM dbo.Alarm;
GO
