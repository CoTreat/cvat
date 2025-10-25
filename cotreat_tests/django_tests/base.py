# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

"""
Base test classes and utilities for Django tests.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

User = get_user_model()


class BaseAPITestCase(APITestCase):
    """
    Base test case for API tests with common setup.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase (runs once per class).
        """
        # Create admin user
        cls.admin_user = User.objects.create_superuser(
            username="admin_test",
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="Test"
        )

        # Create regular user
        cls.regular_user = User.objects.create_user(
            username="user_test",
            email="user@test.com",
            password="testpass123",
            first_name="Regular",
            last_name="User"
        )

    def setUp(self):
        """
        Set up for each test method.
        """
        # Create a fresh client for each test
        self.client = APIClient()
        self.authenticated_client = APIClient()
        self.authenticated_client.force_authenticate(user=self.admin_user)

        self.user_client = APIClient()
        self.user_client.force_authenticate(user=self.regular_user)

    def tearDown(self):
        """
        Clean up after each test method.
        """
        # Cleanup is handled automatically by Django's test framework
        pass
