# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

"""
CoTreat standalone test suite for CVAT backend API.

This test suite runs independently from the Docker-based tests and provides:
- Django native tests (using Django's TestCase)
- Pytest tests (using pytest framework)
- No Docker required
- Fast execution with in-memory database
- Mock data and fixtures

Available test suites:
- django_tests/ - Django native tests (use manage.py test)
- unit_tests/ - Pytest tests (use pytest)
"""

__version__ = "1.0.0"
