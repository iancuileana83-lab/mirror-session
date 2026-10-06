# Deploying Counter Check to Google Cloud Run

Status: **commands only, nothing has been run.** Review first; run them yourself or ask for each step.
The app builds as a plain Node server (`NITRO_PRESET=node-server`, tested locally: `/` and `/rules` answer 200).
The Docker image holds no secrets (`.env` is excluded in `.dockerignore`).

Replace `PROJECT_ID`, `BILLING_ID` and the region if you prefer another (Romania: `europe-west1` or `europe-central2`).
PowerShell, from the project folder.

## 1. Project and APIs

```powershell
gcloud auth login
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 2. Keys into Secret Manager (read from your `.env`, never printed)

```powershell
$y = (Select-String -Path .env -Pattern '^YOUCAM_API_KEY=(.+)$').Matches[0].Groups[1].Value
Set-Content -NoNewline -Path $env:TEMP\yk.txt -Value $y
gcloud secrets create youcam-api-key --data-file=$env:TEMP\yk.txt
Remove-Item $env:TEMP\yk.txt

$g = (Select-String -Path .env -Pattern '^GEMINI_API_KEY=(.+)$').Matches[0].Groups[1].Value
Set-Content -NoNewline -Path $env:TEMP\gk.txt -Value $g
gcloud secrets create gemini-api-key --data-file=$env:TEMP\gk.txt
Remove-Item $env:TEMP\gk.txt
```

## 3. Let Cloud Run read only those two secrets

```powershell
$num = gcloud projects describe PROJECT_ID --format "value(projectNumber)"
$sa = "$num-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding youcam-api-key --member "serviceAccount:$sa" --role roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding gemini-api-key --member "serviceAccount:$sa" --role roles/secretmanager.secretAccessor
```

## 4. Deploy with strict limits

```powershell
gcloud run deploy counter-check --source . --region europe-west1 --allow-unauthenticated `
  --cpu 1 --memory 512Mi --timeout 120 --concurrency 20 `
  --min-instances 0 --max-instances 2 `
  --set-secrets "YOUCAM_API_KEY=youcam-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

`--allow-unauthenticated` makes the link public (judges need no login). `--max-instances 2` and
`--min-instances 0` cap the cost; the app itself adds per-visitor and daily caps (roadmap phase 9).

## 5. Budget alert

```powershell
gcloud billing budgets create --billing-account=BILLING_ID --display-name="counter-check" `
  --budget-amount=10EUR --threshold-rule=percent=0.5 --threshold-rule=percent=1.0
```

## 6. Address and checks

```powershell
gcloud run services describe counter-check --region europe-west1 --format "value(status.url)"
```

Open the URL on a clean browser and a phone: scan with the sample face, read the sample label, check, try on.

## 7. After judging

```powershell
gcloud run services delete counter-check --region europe-west1
gcloud secrets delete youcam-api-key
gcloud secrets delete gemini-api-key
```

Also revoke or rotate both API keys if they were ever exposed.
