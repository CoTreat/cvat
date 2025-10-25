# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model

from .base import BaseAPITestCase

User = get_user_model()


class UsersAPITestCase(BaseAPITestCase):
    """
    Test user-related API endpoints using Django's TestCase.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase.
        """
        super().setUpTestData()

        # Create multiple users for list tests
        cls.test_users = []
        for i in range(5):
            user = User.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="testpass123",
                first_name=f"User{i}",
                last_name="Test"
            )
            cls.test_users.append(user)

    def test_list_users_as_admin(self):
        """
        Test listing users as an admin.
        """
        url = reverse("user-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreater(len(response.data["results"]), 0)

    def test_retrieve_user_detail(self):
        """
        Test retrieving a specific user's details.
        """
        url = reverse("user-detail", kwargs={"pk": self.regular_user.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.regular_user.username)
        self.assertEqual(response.data["email"], self.regular_user.email)

    def test_update_user_profile(self):
        """
        Test updating user profile.
        """
        url = reverse("user-detail", kwargs={"pk": self.admin_user.id})
        data = {
            "first_name": "Updated",
            "last_name": "Name"
        }

        response = self.authenticated_client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.first_name, "Updated")
        self.assertEqual(self.admin_user.last_name, "Name")

    def test_user_cannot_access_without_auth(self):
        """
        Test that unauthenticated users cannot access user list.
        """
        url = reverse("user-list")
        response = self.client.get(url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_regular_user_permissions(self):
        """
        Test that regular users have limited permissions.
        """
        url = reverse("user-detail", kwargs={"pk": self.admin_user.id})
        data = {
            "is_superuser": True
        }

        response = self.user_client.patch(url, data, format="json")
        # Regular users should not be able to modify other users or escalate privileges
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]
        )
