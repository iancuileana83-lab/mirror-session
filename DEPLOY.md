# Deploying Counter Check to Google Cloud Run

Notes for deploying the demo to Google Cloud Run. Replace `PROJECT_ID` and `REGION` with your own values.
The Google Cloud project may host other services: **never touch their services, secrets, databases or
service accounts.** Everything below uses its own names (`counter-check`, `counter-check-*`) and its own
service account.

The app builds as a plain Node server (`NITRO_PRESET=node-server`, tested locally: `/` and `/rules` answer 200).
The Docker image holds no secrets (`.env` is excluded in `.dockerignore`).
PowerShell, from the project folder. `BILLING_ID` is your billing account id.

## 0. Look first (read-only, changes nothing)

```powershell
gcloud run services list --region REGION --project PROJECT_ID
gcloud secrets list --project PROJECT_ID
gcloud iam service-accounts list --project PROJECT_ID
```

Check that none of the names used below already exist.

**Result of step 0 (run read-only with `--project`, no gcloud setting changed):** no name clash with anything already
in the project: none of `counter-check`, `counter-check-youcam-key`, `counter-check-gemini-key` or `counter-check-run`
existed. The four APIs in step 1 were already enabled, so step 1 could be skipped.

## 1. APIs (shared by the project, harmless to other services)

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

**Done Oct 6:** live at https://counter-check-v4fk5lvbla-ez.a.run.app (build succeeded, Ready). The deploy command ended with "Resource counter-check already exists" (a retried create call; the service itself was created from the final build, revision `counter-check-00001`, 100% traffic). That error stopped it before `--allow-unauthenticated` took effect, so the public
setting (every page gave 403), so this was run for counter-check only:

```powershell
gcloud run services add-iam-policy-binding counter-check --region REGION --project PROJECT_ID --member=allUsers --role=roles/run.invoker
```

`--allow-unauthenticated` makes the link public (judges need no login); an organisation policy may block it.
`--max-instances 2` and `--min-instances 0` cap the cost; the app itself adds per-visitor and daily caps (roadmap phase 9).

## 5a. A hard usage counter that survives restarts (needed for the unit caps)

YouCam units: an HD Skin Analysis costs 20 units and a makeup try-on 1 unit. To keep real-photo scans under 1,200 units
in total, the app keeps one small counter object in its own Cloud Storage bucket (compare-and-swap, so two instances
cannot both spend the last call). In-memory counters are not enough on Cloud Run: instances restart and forget.

```powershell
gcloud storage buckets create gs://PROJECT_ID-counter-check-usage --project PROJECT_ID --location REGION `
  --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding gs://PROJECT_ID-counter-check-usage --project PROJECT_ID `
  --member "serviceAccount:counter-check-run@PROJECT_ID.iam.gserviceaccount.com" --role roles/storage.objectUser
```

Then deploy a new revision (same limits as step 5) with the bucket name as an environment variable:

```powershell
gcloud run deploy counter-check --source . --region REGION --project PROJECT_ID `
  --update-env-vars USAGE_BUCKET=PROJECT_ID-counter-check-usage --quiet
```

If the counter cannot be read or written, the paid calls are refused (fail closed) and the visitor sees the saved example.

## 5b. The limits, and an emergency pause

The sample face never calls YouCam: its scan shows a saved result of one real scan (0 units). Only a visitor's own
photo triggers a live scan. Caps (visitor limits are per instance and soft; the daily and total caps are hard):

| Call | Per visitor | Everyone per day | Everyone in total (until Jan 3, 2027) | YouCam units at most |
|------|-------------|------------------|----------------------------------------|----------------------|
| Skin scan (20 units) | 1 per hour, 2 per day | 6 | 60 | 1,200 |
| Try-on (1 unit) | 3 per hour, 4 per day | 20 | 250 | 250 |
| Label reader (Gemini, no YouCam units) | 6 per hour, 12 per day | 100 | 2,000 | 0 |

Together at most 1,450 of 1,891 units (balance on Oct 6, 2026), so at least 441 units stay in reserve.
Raise every cap (a number of 1 or more; this also raises the unit risk) or pause all three paid calls at once, without redeploying:

```powershell
gcloud run services update counter-check --region REGION --update-env-vars DEMO_LIMIT_SCALE=2
gcloud run services update counter-check --region REGION --update-env-vars DEMO_LOCKDOWN=1
gcloud run services update counter-check --region REGION --remove-env-vars DEMO_LOCKDOWN
```

With the pause on, judges still see the sample face, the sample label, the check, the comparison and the
progress page; only the three paid calls show the "paused" message and the saved example.

## 6. Budget alert

```powershell
gcloud billing budgets create --billing-account=BILLING_ID --display-name="counter-check" `
  --budget-amount=10EUR --threshold-rule=percent=0.5 --threshold-rule=percent=1.0
```

(The budget covers the whole billing account, so it also watches the costs of any other project on it.)

## 7. Address and checks

```powershell
gcloud run services describe counter-check --region REGION --format "value(status.url)"
```

Open the URL on a clean browser and a phone: scan with the sample face, read the sample label, check, try on, compare.

## 8. Cleanup: only after the winners are announced (not after the deadline)

Keep the service, the secrets and the service account running through judging and until the winners are
announced. Then:

```powershell
gcloud run services delete counter-check --region REGION
gcloud secrets delete counter-check-youcam-key
gcloud secrets delete counter-check-gemini-key
gcloud storage rm -r gs://PROJECT_ID-counter-check-usage
gcloud iam service-accounts delete counter-check-run@PROJECT_ID.iam.gserviceaccount.com
```

Also revoke or rotate both API keys if they were ever exposed.
