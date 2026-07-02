Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\Admin\.gemini\antigravity-ide\brain\20cd102d-672e-408a-a001-6a1b0316c1cd\media__1782974235388.jpg")
$bmp = New-Object System.Drawing.Bitmap 64, 64
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.DrawImage($img, 0, 0, 64, 64)
$bmp.Save("c:\Users\Admin\Desktop\eCommerce\frontend\public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
