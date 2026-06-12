# Build FleetPilot release APK locally (Windows)
# Output: dist/FleetPilot-release.apk

$ErrorActionPreference = "Stop"
$cache = "D:\fp-cache"
$mobile = Split-Path $PSScriptRoot -Parent

New-Item -ItemType Directory -Force -Path "$cache\gradle", "$cache\tmp", "$mobile\dist" | Out-Null

$env:GRADLE_USER_HOME = "$cache\gradle"
$env:TMP = "$cache\tmp"
$env:TEMP = "$cache\tmp"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
$env:ANDROID_HOME = "C:\Users\Sanaullah\AppData\Local\Android\Sdk"
$env:EXPO_PUBLIC_API_URL = if ($env:EXPO_PUBLIC_API_URL) { $env:EXPO_PUBLIC_API_URL } else { "http://192.168.0.120:8000/api/v1" }
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Push-Location $mobile
try {
  npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $localProps = @"
sdk.dir=C\:\\Users\\Sanaullah\\AppData\\Local\\Android\\Sdk
ndk.dir=D\:\\Android\\Sdk\\ndk\\27.1.12297006
"@
  Set-Content -Path "$mobile\android\local.properties" -Value $localProps -Encoding ASCII
  $gradleProps = Get-Content "$mobile\android\gradle.properties"
  $gradleProps = $gradleProps -replace 'newArchEnabled=true','newArchEnabled=false'
  $gradleProps = $gradleProps -replace 'edgeToEdgeEnabled=true','edgeToEdgeEnabled=false'
  $gradleProps | Set-Content "$mobile\android\gradle.properties"

  $mainActivity = "$mobile\android\app\src\main\java\com\fleetpilot\mobile\MainActivity.kt"
  if (Test-Path $mainActivity) {
    (Get-Content $mainActivity) -replace 'super\.onCreate\(null\)','super.onCreate(savedInstanceState)' | Set-Content $mainActivity
  }

  Push-Location "$mobile\android"
  try {
    .\gradlew.bat :app:createBundleReleaseJsAndAssets --rerun-tasks assembleRelease --no-daemon --gradle-user-home "$cache\gradle"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $apk = Get-ChildItem -Path "app\build\outputs\apk\release\*.apk" | Select-Object -First 1
    if (-not $apk) { throw "APK not found after build." }

    $dest = Join-Path $mobile "dist\FleetPilot-release.apk"
    Copy-Item $apk.FullName $dest -Force
    Write-Host ""
    Write-Host "APK created: $dest" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($apk.Length / 1MB, 2)) MB"
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}
