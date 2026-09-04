# ==============================================================================
# Jasper OS — Repository Structure & Documentation Integrity Test
# ==============================================================================
$ErrorActionPreference = "Stop"

$expectedDirs = @(
    "kernel",
    "system",
    "desktop",
    "shell",
    "applications",
    "jasper-ai",
    "services",
    "installer",
    "packages",
    "drivers",
    "tools",
    "documentation",
    "tests"
)

$baseDir = "$PSScriptRoot\.."
Write-Host "Running Jasper OS Structure Integrity Tests..." -ForegroundColor Cyan

$passed = 0
$failed = 0

foreach ($dir in $expectedDirs) {
    $target = Join-Path $baseDir $dir
    if (Test-Path $target) {
        Write-Host "  ✅ Directory exists: jasper-os/$dir" -ForegroundColor Green
        $readme = Join-Path $target "README.md"
        if (Test-Path $readme) {
            Write-Host "     ✅ Documentation exists: jasper-os/$dir/README.md" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "     ❌ Missing README.md in jasper-os/$dir" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "  ❌ Missing directory: jasper-os/$dir" -ForegroundColor Red
        $failed++
    }
}

# Verify Core Documentation Files
$docFiles = @(
    "documentation/HARDWARE_REPORT.md",
    "documentation/DUAL_BOOT_SAFETY_GUIDE.md",
    "documentation/ARCHITECTURE.md"
)

foreach ($doc in $docFiles) {
    $target = Join-Path $baseDir $doc
    if (Test-Path $target) {
        Write-Host "  ✅ Core Doc exists: jasper-os/$doc" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ Missing Core Doc: jasper-os/$doc" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
if ($failed -eq 0) {
    Write-Host "🎉 ALL $passed TESTS PASSED! Jasper OS structure is 100% compliant." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ $failed TESTS FAILED!" -ForegroundColor Red
    exit 1
}
