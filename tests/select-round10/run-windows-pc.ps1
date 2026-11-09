# Round 10 Windows-PC reproduction. Run locally in PowerShell 7.
# This script never uploads raw screenshots or traces.
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$ExpectedHead,
  [Parameter(Mandatory=$true)]
  [string]$Workspace,
  [Parameter(Mandatory=$true)]
  [string]$EvidenceDirectory
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'

function Require-Exit([string]$Name) {
  if ($LASTEXITCODE -ne 0) { throw ("{0} failed (exit {1})" -f $Name,$LASTEXITCODE) }
}
function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "Missing command: $Name" }
}
foreach($name in @('git','node','npm','npx','python')) { Require-Command $name }
$Workspace=[System.IO.Path]::GetFullPath($Workspace)
$EvidenceDirectory=[System.IO.Path]::GetFullPath($EvidenceDirectory)
if ((Test-Path -LiteralPath $Workspace) -or (Test-Path -LiteralPath $EvidenceDirectory)) {
  throw 'Workspace and EvidenceDirectory must both be new; no overwrite allowed'
}
New-Item -ItemType Directory -Path $EvidenceDirectory | Out-Null
$report=Join-Path $EvidenceDirectory 'local-report'
New-Item -ItemType Directory -Path $report | Out-Null
$env:ROUND10_EXPECT_HEAD=$ExpectedHead
$env:ROUND10_EXPECT_PLATFORM='win32'
$env:ROUND10_OUT=Join-Path $EvidenceDirectory 'raw'

try {
  & git clone --quiet --no-checkout 'https://github.com/tetsujisugimori-coder/intelligence-ui-museum.git' $Workspace
  Require-Exit 'git clone'
  Push-Location $Workspace
  try {
    & git checkout --detach $ExpectedHead
    Require-Exit 'git checkout'
    $actual=(& git rev-parse HEAD).Trim()
    Require-Exit 'git rev-parse HEAD'
    if($actual -cne $ExpectedHead){ throw "HEAD mismatch: $actual" }
    $dirty=(& git status --porcelain)
    Require-Exit 'git status'
    if($dirty){throw 'Unexpected dirty checkout'}
    & python scripts/prepare-work.py
    Require-Exit 'prepare-work'
    & npm --prefix .work/v10 ci --ignore-scripts --no-audit --no-fund
    Require-Exit 'Museum npm ci'
    & npm --prefix .work/v10 run build
    Require-Exit 'Museum build'
    & npm --prefix tools/stage-a-browser ci --ignore-scripts --no-audit --no-fund
    Require-Exit 'Playwright npm ci'
    Push-Location tools/stage-a-browser
    try {
      & npx playwright install webkit
      Require-Exit 'Playwright install webkit'
    } finally { Pop-Location }
    & node --test tests/select-round10/contract.test.cjs 1> (Join-Path $report 'contract.log') 2> (Join-Path $report 'contract-stderr.log')
    $contractExit=$LASTEXITCODE
    Set-Content -LiteralPath (Join-Path $report 'contract-exit.txt') -Value "$contractExit"
    if($contractExit -ne 0){throw "Contract check failed; see local report"}
    & node tests/select-round10/run.cjs 1> (Join-Path $report 'runner.log') 2> (Join-Path $report 'runner-stderr.log')
    $runnerExit=$LASTEXITCODE
    Set-Content -LiteralPath (Join-Path $report 'runner-exit.txt') -Value "$runnerExit"
    if(Test-Path -LiteralPath (Join-Path $env:ROUND10_OUT 'results.json')) {
      & node tests/select-round10/audit.cjs $env:ROUND10_OUT 1> (Join-Path $report 'audit.json') 2> (Join-Path $report 'audit-stderr.log')
      $auditExit=$LASTEXITCODE
    }else{
      $auditExit=1
      Set-Content -LiteralPath (Join-Path $report 'audit-stderr.log') -Value 'results.json not produced; auditor NOT_RUN'
    }
    Set-Content -LiteralPath (Join-Path $report 'audit-exit.txt') -Value "$auditExit"
    if(Test-Path -LiteralPath (Join-Path $env:ROUND10_OUT 'results.json')) {
      $rawReport=Get-Content -LiteralPath (Join-Path $env:ROUND10_OUT 'results.json') -Raw | ConvertFrom-Json
      $summary=[ordered]@{
        head=$actual
        tree=((& git rev-parse 'HEAD^{tree}').Trim())
        timestampJST=(Get-Date).ToUniversalTime().AddHours(9).ToString('yyyy-MM-ddTHH:mm:ss+09:00')
        os=[Environment]::OSVersion.VersionString
        node=(& node --version).Trim()
        playwright=$rawReport.playwright
        sdk=$rawReport.sdkVersion
        rows=$rawReport.rows.Count
        diagnosticComplete=@($rawReport.rows|Where-Object {$_.classification.diagnostic -eq 'COMPLETE'}).Count
        unconfirmedPairs=@($rawReport.pairs|Where-Object {$_.equivalence -eq 'UNCONFIRMED'}).Count
        runnerExit=$runnerExit
        auditorExit=$auditExit
        rootCause='UNKNOWN'
        stage3='HOLD'
        rawEvidenceLocation='local-only; not uploaded'
      }
      $summary|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $report 'summary.json') -Encoding utf8
    }
    if(Test-Path -LiteralPath $env:ROUND10_OUT) {
      $archive=Join-Path $EvidenceDirectory 'round10-windows-original.zip'
      Compress-Archive -LiteralPath $env:ROUND10_OUT -DestinationPath $archive -CompressionLevel Optimal
      $sum=Get-FileHash -LiteralPath $archive -Algorithm SHA256
      $sum.Hash.ToLowerInvariant()|Set-Content -LiteralPath (Join-Path $report 'raw-zip-sha256.txt')
    }
    if($runnerExit -ne 0 -or $auditExit -ne 0) {
      throw "Round10 diagnostic incomplete: runner=$runnerExit auditor=$auditExit; preserve original local evidence"
    }
  } finally { Pop-Location }
} finally {
  Write-Host "Local report: $report"
  Write-Host "Raw data (LOCAL ONLY): $env:ROUND10_OUT"
  Write-Host 'No evidence was uploaded by this script'
}
