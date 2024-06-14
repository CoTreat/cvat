# Create a temporary directory
TEMP_DIR=$(mktemp -d)

echo "Downloading deploy file..."
# Load the tar.gz file from Google Cloud Storage to the temporary directory
gsutil cp gs://cotreat-cvat/deploy.tar.gz $TEMP_DIR

mkdir $TEMP_DIR/deploy

echo "Unziping deploy file..."
# Unzip the file to the temporary directory
tar -xzf $TEMP_DIR/deploy.tar.gz -C $TEMP_DIR/deploy

echo "Sync deploy file..."
# Sync the unzipped folder with the existing /cvat folder
sudo rsync -av --delete $TEMP_DIR/deploy/ /cvat/

# Set environment variables
export CVAT_HOST=cvat.cotreat.io
export ACME_EMAIL=engineering@cotreat.com.au

# Sendgrid SMTP info
# https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api
EMAIL_HOST_PASSWORD=$(gcloud secrets versions access latest --secret="cotreat-cvat-sendgrid-api-key")
export EMAIL_HOST_PASSWORD
export EMAIL_HOST=smtp.sendgrid.net
export EMAIL_HOST_USER=apikey
export EMAIL_PORT=587

echo "Rebuild and start cvat..."
# Rebuild the application in the /cvat folder
cd /cvat
sudo -E docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.https.yml up --build -d

echo "Clean downloaded deploy file"
# Clean up the temporary directory
rm -rf $TEMP_DIR
