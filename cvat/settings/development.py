# Copyright (C) 2018-2022 Intel Corporation
#
# SPDX-License-Identifier: MIT

# Inherit parent config
from .base import *  # pylint: disable=wildcard-import

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INSTALLED_APPS += [
    "django_extensions",
]

ALLOWED_HOSTS.append("testserver")

# Django-sendfile:
# https://github.com/moggers87/django-sendfile2
SENDFILE_BACKEND = "django_sendfile.backends.development"

# Cross-Origin Resource Sharing settings for CVAT UI
UI_SCHEME = os.environ.get("CVAT_UI_SCHEME", "http")
UI_HOST = os.environ.get("CVAT_UI_HOST", "localhost")
UI_PORT = os.environ.get("CVAT_UI_PORT", 3000)
CORS_ALLOW_CREDENTIALS = True
UI_URL = "{}://{}".format(UI_SCHEME, UI_HOST)

if UI_PORT and UI_PORT != "80":
    UI_URL += ":{}".format(UI_PORT)

CSRF_TRUSTED_ORIGINS = [UI_URL]

# set UI url to redirect to after successful e-mail confirmation
ACCOUNT_EMAIL_CONFIRMATION_ANONYMOUS_REDIRECT_URL = "{}/auth/email-confirmation".format(UI_URL)
ACCOUNT_EMAIL_VERIFICATION_SENT_REDIRECT_URL = "{}/auth/email-verification-sent".format(UI_URL)
INCORRECT_EMAIL_CONFIRMATION_URL = "{}/auth/incorrect-email-confirmation".format(UI_URL)

CORS_ORIGIN_WHITELIST = [UI_URL]
CORS_REPLACE_HTTPS_REFERER = True
IAM_OPA_HOST = "http://localhost:8181"
IAM_OPA_DATA_URL = f"{IAM_OPA_HOST}/v1/data"

INSTALLED_APPS += ["silk"]

MIDDLEWARE += [
    "silk.middleware.SilkyMiddleware",
]

# Django profiler
# https://github.com/jazzband/django-silk
SILKY_PYTHON_PROFILER = True
SILKY_PYTHON_PROFILER_BINARY = True
SILKY_PYTHON_PROFILER_RESULT_PATH = os.path.join(BASE_DIR, "profiles/")
os.makedirs(SILKY_PYTHON_PROFILER_RESULT_PATH, exist_ok=True)
SILKY_AUTHENTICATION = True
SILKY_AUTHORISATION = True
SILKY_MAX_REQUEST_BODY_SIZE = 1024
SILKY_MAX_RESPONSE_BODY_SIZE = 1024
SILKY_IGNORE_PATHS = ["/admin", "/documentation", "/django-rq", "/auth"]
SILKY_MAX_RECORDED_REQUESTS = 10**4

# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
DATABASES["default"]["HOST"] = os.getenv("CVAT_POSTGRES_HOST", "localhost")

SMOKESCREEN_ENABLED = False

# Enable Analytics plugin for development. This overrides the base setting just for development.
ANALYTICS_ENABLED = True

# Enable Vector logger for analytics events in hybrid dev mode
# Set environment variables if not already set (for hybrid dev mode where Django runs locally)
if not os.getenv("DJANGO_LOG_SERVER_HOST"):
    os.environ.setdefault("DJANGO_LOG_SERVER_HOST", "localhost")
if not os.getenv("DJANGO_LOG_SERVER_PORT"):
    os.environ.setdefault("DJANGO_LOG_SERVER_PORT", "8282")

# Update handler config to use correct values (handler config is evaluated at module load time)
# Ensure it uses localhost:8282 for hybrid dev mode
if "vector" in LOGGING["handlers"]:
    LOGGING["handlers"]["vector"]["host"] = os.getenv("DJANGO_LOG_SERVER_HOST", "localhost")
    LOGGING["handlers"]["vector"]["port"] = int(os.getenv("DJANGO_LOG_SERVER_PORT", "8282"))

# Ensure vector handler is attached for development (base.py only adds it if DJANGO_LOG_SERVER_HOST is set)
# Since we just set it above, we need to manually add the handler
if "vector" not in LOGGING["loggers"]["vector"]["handlers"]:
    LOGGING["loggers"]["vector"]["handlers"].append("vector")
