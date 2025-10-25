#!/bin/bash
# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

# Script to run CoTreat Django native tests

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}CoTreat Django Native Test Runner${NC}"
echo -e "${BLUE}====================================${NC}"
echo

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CVAT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}CVAT Root:${NC} $CVAT_ROOT"
echo -e "${BLUE}Test Directory:${NC} $SCRIPT_DIR"
echo

# Change to CVAT root directory
cd "$CVAT_ROOT"

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${RED}Warning: No virtual environment detected${NC}"
    echo "Using .venv/bin/python from CVAT root"
    PYTHON_CMD=".venv/bin/python"
else
    PYTHON_CMD="python"
fi

# Set Django settings module
export DJANGO_SETTINGS_MODULE=cvat.settings.testing

# Add CVAT root to Python path so Django can find cotreat_tests module
export PYTHONPATH="$CVAT_ROOT:$PYTHONPATH"

# Parse command line arguments
if [ $# -eq 0 ]; then
    # No arguments, run all Django test modules individually
    # (Running them individually avoids test discovery issues)
    TEST_PATH="cotreat_tests.django_tests.test_auth cotreat_tests.django_tests.test_users cotreat_tests.django_tests.test_projects cotreat_tests.django_tests.test_tasks"
    echo -e "${BLUE}Running all Django tests${NC}"
else
    # Pass through first argument as test path
    TEST_PATH="$1"
    echo -e "${BLUE}Running tests: $TEST_PATH${NC}"
fi

echo

# Run Django tests
$PYTHON_CMD manage.py test $TEST_PATH --verbosity=2

# Capture exit code
EXIT_CODE=$?

echo
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

exit $EXIT_CODE
