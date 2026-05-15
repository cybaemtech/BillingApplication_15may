param(
  [string]$SourceDir = "supabase/migrations",
  [string]$OutDir = "database/mssql"
)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$files = Get-ChildItem -Path $SourceDir -File | Sort-Object Name

foreach ($file in $files) {
  $lines = Get-Content $file.FullName
  $out = New-Object System.Collections.Generic.List[string]

  $skipDollarBlock = $false
  foreach ($line in $lines) {
    $trim = $line.Trim()

    if ($trim -match '^CREATE\s+OR\s+REPLACE\s+FUNCTION\b') {
      $skipDollarBlock = $true
      continue
    }

    if ($skipDollarBlock) {
      if ($trim -match '^\$\$;\s*$') {
        $skipDollarBlock = $false
      }
      continue
    }

    if ($trim -match '^CREATE\s+TRIGGER\b') { continue }
    if ($trim -match '^DROP\s+POLICY\b') { continue }
    if ($trim -match '^CREATE\s+POLICY\b') { continue }
    if ($trim -match '^ALTER\s+TABLE\s+.+ENABLE\s+ROW\s+LEVEL\s+SECURITY') { continue }
    if ($trim -match '^GRANT\s+') { continue }
    if ($trim -match '^REVOKE\s+') { continue }
    if ($trim -match '^CREATE\s+TYPE\b') { continue }

    $out.Add($line)
  }

  $text = ($out -join "`r`n")

  $text = $text -replace '\bpublic\.', 'dbo.'
  $text = $text -replace '\bauth\.users\b', 'dbo.users'

  $text = $text -replace '\bTIMESTAMPTZ\b', 'DATETIME2'
  $text = $text -replace '\btimestamptz\b', 'DATETIME2'
  $text = $text -replace '\bUUID\b', 'UNIQUEIDENTIFIER'
  $text = $text -replace '\buuid\b', 'UNIQUEIDENTIFIER'

  $text = $text -replace '\bJSONB\b', 'NVARCHAR(MAX)'
  $text = $text -replace '\bjsonb\b', 'NVARCHAR(MAX)'
  $text = $text -replace '\bJSON\b', 'NVARCHAR(MAX)'
  $text = $text -replace '\bjson\b', 'NVARCHAR(MAX)'
  $text = $text -replace '\bTEXT\b', 'NVARCHAR(MAX)'
  $text = $text -replace '\btext\b', 'NVARCHAR(MAX)'

  $text = $text -replace '\bBOOLEAN\b', 'BIT'
  $text = $text -replace '\bboolean\b', 'BIT'
  $text = $text -replace '\bTRUE\b', '1'
  $text = $text -replace '\bFALSE\b', '0'
  $text = $text -replace '\btrue\b', '1'
  $text = $text -replace '\bfalse\b', '0'

  $text = $text -replace 'DEFAULT\s+gen_random_uuid\(\)', 'DEFAULT NEWID()'
  $text = $text -replace 'DEFAULT\s+now\(\)', 'DEFAULT GETDATE()'
  $text = $text -replace 'CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS', 'CREATE TABLE'
  $text = $text -replace 'ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS', 'ADD'

  $text = $text -replace '\bapp_role\b', 'VARCHAR(50)'
  $text = $text -replace '\bdocument_status\b', 'VARCHAR(30)'
  $text = $text -replace '\bstock_movement_type\b', 'VARCHAR(30)'
  $text = $text -replace '\bjournal_type\b', 'VARCHAR(30)'

  $text = $text -replace '\bnumeric\((\d+)\s*,\s*(\d+)\)', 'DECIMAL($1,$2)'
  $text = $text -replace '\bnumeric\b', 'DECIMAL(18,2)'

  $header = @(
    '-- SQL Server converted migration (auto-converted from Supabase/PostgreSQL).',
    '-- Removed PostgreSQL-only constructs: RLS policies, plpgsql functions, Supabase auth hooks.',
    'SET ANSI_NULLS ON;',
    'SET QUOTED_IDENTIFIER ON;',
    'GO',
    ''
  ) -join "`r`n"

  $outFile = Join-Path $OutDir ("mssql_" + $file.Name)
  Set-Content -Path $outFile -Value ($header + $text)
}
