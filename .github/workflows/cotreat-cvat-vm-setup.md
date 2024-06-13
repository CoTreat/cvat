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

## Setup Https

See https://docs.cvat.ai/docs/administration/basics/installation/#deploy-secure-cvat-instance-with-https

Basically we need to setup two environments:

```
export CVAT_HOST=cvat.cotreat.io
export ACME_EMAIL=engineering@cotreat.com.au
```




