param([string]$AuditDir)
Add-Type -AssemblyName System.Drawing
$rows = (Get-Content (Join-Path $AuditDir 'boundaries/results.json') -Raw -Encoding utf8 | ConvertFrom-Json).audits
foreach ($engine in @('chromium','webkit')) {
  foreach ($zoom in @(1,2)) {
    $selected = @($rows | Where-Object { $_.file -like "$engine-*-$zoom-*.png" })
    $sheet = New-Object System.Drawing.Bitmap 1440,1320
    $g = [System.Drawing.Graphics]::FromImage($sheet)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $font = New-Object System.Drawing.Font 'Consolas',12
    for ($i=0; $i -lt $selected.Count; $i++) {
      $r=$selected[$i]; $x=($i%3)*480; $y=[math]::Floor($i/3)*330
      $g.DrawString($r.file,$font,[System.Drawing.Brushes]::Black,$x+6,$y+4)
      $b=$r.glyphBounds; $f=$r.fullRegion
      $g.DrawString("ROI 0,0 -> $($f.width-1),$($f.height-1)",$font,[System.Drawing.Brushes]::DarkGreen,$x+6,$y+26)
      $g.DrawString("INK $($b.left),$($b.top) -> $($b.right),$($b.bottom)",$font,[System.Drawing.Brushes]::Red,$x+6,$y+46)
      $img=[System.Drawing.Image]::FromFile((Join-Path $AuditDir ('boundaries/overlay-'+$r.file)))
      $g.DrawImage($img,[System.Drawing.Rectangle]::new($x+6,$y+68,$img.Width*3,$img.Height*3))
      $img.Dispose()
    }
    $sheet.Save((Join-Path $AuditDir "contact-$engine-$zoom.png"),[System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $sheet.Dispose(); $font.Dispose()
  }
}
