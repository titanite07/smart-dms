$files = Get-ChildItem -Path "backend" -Include *.js, *.ts -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules' }
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content) {
        $content = $content -replace '(?m)^\s*//.*$', ''
        $content = $content -replace '(?m)\s+//.*$', ''
        $content = $content -replace '(?s)/\*.*?\*/', ''
        $content = $content -replace '(?s)/\*\*.*?\*/', ''
        $content = $content -replace '(?m)^\s*$\n', ''
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    }
}

$frontendJSFiles = Get-ChildItem -Path "frontend/src" -Include *.ts, *.js -Recurse -File
foreach ($file in $frontendJSFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content) {
        $content = $content -replace '(?m)^\s*//.*$', ''
        $content = $content -replace '(?m)\s+//.*$', ''
        $content = $content -replace '(?s)/\*.*?\*/', ''
        $content = $content -replace '(?s)/\*\*.*?\*/', ''
        $content = $content -replace '(?m)^\s*$\n', ''
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    }
}

$frontendHTMLFiles = Get-ChildItem -Path "frontend/src" -Include *.html -Recurse -File
foreach ($file in $frontendHTMLFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content) {
        $content = $content -replace '(?s)<!--.*?-->', ''
        $content = $content -replace '(?m)^\s*$\n', ''
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    }
}

$frontendCSSFiles = Get-ChildItem -Path "frontend/src" -Include *.css -Recurse -File
foreach ($file in $frontendCSSFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content) {
        $content = $content -replace '(?s)/\*.*?\*/', ''
        $content = $content -replace '(?m)^\s*$\n', ''
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    }
}

Write-Host "All comments removed!" -ForegroundColor Green
