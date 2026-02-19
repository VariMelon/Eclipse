$ErrorActionPreference = 'Stop'
$base = 'https://eclipse-five-wheat.vercel.app'

Write-Output 'CHECK 1: Moderation/validation reject (forbidden char in signup name)'
try {
  $resp = Invoke-WebRequest -Uri "$base/api/signup" -Method Post -ContentType 'application/json' -Body (@{ email='moderation-check@eclipse.local'; password='Eclipse!23456'; name='bad_name' } | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
  Write-Output ("unexpected status=" + [int]$resp.StatusCode)
  Write-Output $resp.Content
} catch {
  $r = $_.Exception.Response
  $code = [int]$r.StatusCode
  $body = (New-Object System.IO.StreamReader($r.GetResponseStream())).ReadToEnd()
  Write-Output ("status=" + $code)
  Write-Output ("body=" + $body)
}

Write-Output 'CHECK 2: Signin rate-limit headers and threshold'
$targetEmail = 'ratelimit-check@eclipse.local'
for ($i = 1; $i -le 11; $i++) {
  try {
    $res = Invoke-WebRequest -Uri "$base/api/signin" -Method Post -ContentType 'application/json' -Body (@{ email=$targetEmail; password='wrongpass' } | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $status = [int]$res.StatusCode
    $limit = $res.Headers['X-RateLimit-Limit']
    $remaining = $res.Headers['X-RateLimit-Remaining']
    $retryAfter = $res.Headers['Retry-After']
    Write-Output ("attempt $i status=$status limit=$limit remaining=$remaining retryAfter=$retryAfter")
  } catch {
    $r = $_.Exception.Response
    $status = [int]$r.StatusCode
    $limit = $r.Headers['X-RateLimit-Limit']
    $remaining = $r.Headers['X-RateLimit-Remaining']
    $retryAfter = $r.Headers['Retry-After']
    Write-Output ("attempt $i status=$status limit=$limit remaining=$remaining retryAfter=$retryAfter")
  }
}
