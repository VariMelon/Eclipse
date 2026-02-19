$ErrorActionPreference = 'Stop'
$base = 'https://eclipse-five-wheat.vercel.app'

Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient

function Send-JsonRequest($uri, $payload, $headers = @{}) {
  $json = $payload | ConvertTo-Json -Compress
  $content = New-Object System.Net.Http.StringContent($json, [System.Text.Encoding]::UTF8, 'application/json')
  $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, $uri)
  $request.Content = $content

  foreach ($key in $headers.Keys) {
    $request.Headers.TryAddWithoutValidation($key, $headers[$key]) | Out-Null
  }

  return $client.SendAsync($request).GetAwaiter().GetResult()
}

function Get-HeaderValue($headers, $name) {
  $values = $null
  if ($headers.TryGetValues($name, [ref]$values)) {
    return ($values | Select-Object -First 1)
  }

  return ''
}

Write-Output 'CHECK 1: Moderation/validation reject (forbidden char in signup name)'
try {
  $resp = Send-JsonRequest "$base/api/signup" @{ email='moderation-check@eclipse.local'; password='Eclipse!23456'; name='bad_name' }
  $status = [int]$resp.StatusCode
  $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if ($status -eq 400) {
    Write-Output ("status=" + $status)
    Write-Output ("body=" + $body)
  } else {
    Write-Output ("unexpected status=" + $status)
    Write-Output $body
  }
} catch {
  $r = $_.Exception.Response
  $code = [int]$r.StatusCode
  $body = (New-Object System.IO.StreamReader($r.GetResponseStream())).ReadToEnd()
  Write-Output ("status=" + $code)
  Write-Output ("body=" + $body)
}

Write-Output 'CHECK 2: Signin rate-limit headers and threshold'
$targetEmail = ("ratelimit-check-" + [Guid]::NewGuid().ToString('N') + '@eclipse.local')
for ($i = 1; $i -le 11; $i++) {
  try {
    $ipSuffix = Get-Random -Minimum 2 -Maximum 254
    $headers = @{ 'X-Forwarded-For' = "203.0.113.$ipSuffix" }
    $res = Send-JsonRequest "$base/api/signin" @{ email=$targetEmail; password='WrongKey123!' } $headers
    $status = [int]$res.StatusCode
    $limit = Get-HeaderValue $res.Headers 'X-RateLimit-Limit'
    $remaining = Get-HeaderValue $res.Headers 'X-RateLimit-Remaining'
    $retryAfter = Get-HeaderValue $res.Headers 'Retry-After'
    $body = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Write-Output ("attempt $i status=$status limit=$limit remaining=$remaining retryAfter=$retryAfter")
    if ($body) {
      Write-Output ("body=$body")
    }
  } catch {
    Write-Output ("attempt $i failed=" + $_.Exception.Message)
  }
}
