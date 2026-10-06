# Deploying Counter Check to Google Cloud Run

Status: **commands only, nothing has been run.** Each step is run only after the owner's OK.
Project `PROJECT_ID`, region `REGION`. The project also hosts another project: **never touch
its service, secrets, database or service account.** Everything below uses its own names
(`counter-check`, `counter-check-*`) and its own service account.

The app builds as a plain Node server (`NITRO_PRESET=node-server`, tested locally: `/` and `/rules` answer 200).
The Docker image holds no secrets (`.env` is excluded in `.dockerignore`).
PowerShell, from the project folder. `BILLING_ID` is your billing account id.

## 0. Look first (read-only, changes nothing)

```powershell
gcloud config set project PROJECT_ID
gcloud run services list --region REGION
gcloud secrets list
gcloud iam service-accounts list
```

Check that none of the names used below already exist.

## 1. APIs (shared by the project, harmless to another project)

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 2. A separate service account for this app only

```powershell
gcloud iam service-accounts create counter-check-run --display-name "Counter Check (Cloud Run)"
```

## 3. Keys into Secret Manager (read from your `.env`, never printed)

```powershell
$y = (Select-String -Path .env -Pattern '^YOUCAM_API_KEY=(.+)$').Matches[0].Groups[1].Value
Set-Content -NoNewline -Path $env:TEMP\yk.txt -Value $y
gcloud secrets create counter-check-youcam-key --data-file=$env:TEMP\yk.txt
Remove-Item $env:TEMP\yk.txt

$g = (Select-String -Path .env -Pattern '^GEMINI_API_KEY=(.+)$').Matches[0].Groups[1].Value
Set-Content -NoNewline -Path $env:TEMP\gk.txt -Value $g
gcloud secrets create counter-check-gemini-key --data-file=$env:TEMP\gk.txt
Remove-Item $env:TEMP\gk.txt
```

## 4. Let only that service account read only those two secrets

```powershell
$sa = "counter-check-run@PROJECT_ID.iam.gserviceaccount.com"
gcloud secrets add-iam-policy-binding counter-check-youcam-key --member "serviceAccount:$sa" --role roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding counter-check-gemini-key --member "serviceAccount:$sa" --role roles/secretmanager.secretAccessor
```

## 5. Deploy with strict limits

```powershell
gcloud run deploy counter-check --source . --region REGION --allow-unauthenticated `
  --service-account "counter-check-run@PROJECT_ID.iam.gserviceaccount.com" `
  --cpu 1 --memory 512Mi --timeout 120 --concurrency 20 `
  --min-instances 0 --max-instances 2 `
  --set-secrets "YOUCAM_API_KEY=counter-check-youcam-key:latest,GEMINI_API_KEY=counter-check-gemini-key:latest"
```

`--allow-unauthenticated` makes the link public (judges need no login); an organisation policy may block it.
`--max-instances 2` and `--min-instances 0` cap the cost; the app itself adds per-visitor and daily caps (roadmap phase 9).

## 6. Budget alert

```powershell
gcloud billing budgets create --billing-account=BILLING_ID --display-name="counter-check" `
  --budget-amount=10EUR --threshold-rule=percent=0.5 --threshold-rule=percent=1.0
```

(The budget covers the whole billing account, so it also watches another project's costs.)

## 7. Address and checks

```powershell
gcloud run services describe counter-check --region REGION --format "value(status.url)"
```

Open the URL on a clean browser and a phone: scan with the sample face, read the sample label, check, try on, compare.

## 8. After judging

```powershell
gcloud run services delete counter-check --region REGION
gcloud secrets delete counter-check-youcam-key
gcloud secrets delete counter-check-gemini-key
gcloud iam service-accounts delete counter-check-run@PROJECT_ID.iam.gserviceaccount.com
```

Also revoke or rotate both API keys if they were ever exposed.
