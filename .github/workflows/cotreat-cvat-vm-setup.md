# Initial Setup for Self Host CVAT on GCP

CVAT is hosted on Compute Engine. Our current CICD only do update, so we need to manually set it up first.

## Create VM Instance

Use the command below:

```
gcloud compute instances create cotreat-cvat \
    --project=cotreat-prod \
    --zone=australia-southeast1-b \
    --machine-type=e2-highmem-2 \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --metadata=enable-osconfig=TRUE \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=cotreat-ai@cotreat-prod.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,https-server,lb-health-check \
    --create-disk=auto-delete=yes,boot=yes,device-name=cotreat-cvat,image=projects/debian-cloud/global/images/debian-12-bookworm-v20240611,mode=rw,size=100,type=projects/cotreat-prod/zones/australia-southeast1-c/diskTypes/pd-balanced \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ops-agent-policy=v2-x86-template-1-2-0,goog-ec-src=vm_add-gcloud \
    --reservation-affinity=any
```

## Add Snapshot Schedule

```
gcloud compute resource-policies create snapshot-schedule cotreat-cvat-schedule \
    --project=cotreat-prod \
    --region=australia-southeast1 \
    --max-retention-days=14 \
    --on-source-disk-delete=keep-auto-snapshots \
    --daily-schedule \
    --start-time=15:00 \
    --storage-location=australia-southeast1
```

## Install Docker and other tools

Follow https://docs.docker.com/engine/install/debian/ to install docker

## Install rsync

we use rsync to sync new deploy files with existing one:

```
sudo apt-get update
sudo apt-get install rsync
```

## Setup CVAT code

Our current approach for deploy code to CVAT VM is:

- upload our source code to cloud storage
- in the cvat startup script:
    - download source code from cloud storage
    - unzip the file
    - sync the latest code to the existing code
    - rebuild docker compose
    - start the application

## Build from source

The default `docker-compose.yml` use CVAT's built image from docker, which means if we change anything in the source code, they are not gonna be used, so we should run with `docker-compose.dev` (and `docker-compose.https.yml`):

```
sudo -E docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.https.yml
```

## Setup Https & Domain

See https://docs.cvat.ai/docs/administration/basics/installation/#deploy-secure-cvat-instance-with-https

Basically we need to setup two environments:

```
export CVAT_HOST=cvat.cotreat.io
export ACME_EMAIL=engineering@cotreat.com.au
```

## Setup Email Service

see https://docs.cvat.ai/docs/administration/basics/installation/#email-verification, but basically the environments should be set in `cvat/settings/base.py`

```
EMAIL_USE_TLS = True
# We are using Sengrid SMTP service
# https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
# todo not best practice to hardcode the sendgrid key here, consider putting in a secret manager
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_PORT = os.getenv('EMAIL_PORT') or 587

# Email backend settings for Django
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
```

We will then pass them via `docker-compose.yml`:

```
cvat_server:
    ...
    environment:
        ...
        EMAIL_HOST: ${EMAIL_HOST}
        EMAIL_HOST_USER: ${EMAIL_HOST_USER}
        EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD}
        EMAIL_PORT: ${EMAIL_PORT}
```

We can then set envs in our startup script. Notice secrets like `EMAIL_HOST_PASSWORD` we will load from services like Google Secret Manager



