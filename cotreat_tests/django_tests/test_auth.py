# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from django.urls import reverse
from rest_framework import status

from .base import BaseAPITestCase


class AuthenticationAPITestCase(BaseAPITestCase):
    """
    Test authentication-related API endpoints using Django's TestCase.
    """

    def test_user_registration(self):
        """
        Test user registration endpoint.
        """
        url = reverse("rest_register")
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password1": "testpass123",
            "password2": "testpass123",
            "first_name": "New",
            "last_name": "User"
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue("key" in response.data or "detail" in response.data)

    def test_user_login(self):
        """
        Test user login endpoint.
        """
        url = reverse("rest_login")
        data = {
            "username": self.admin_user.username,
            "password": "testpass123"
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("key", response.data)

    def test_user_logout(self):
        """
        Test user logout endpoint.
        """
        url = reverse("rest_logout")
        response = self.authenticated_client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_current_user(self):
        """
        Test retrieving current authenticated user.
        """
        url = reverse("user-self")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.admin_user.username)
        self.assertEqual(response.data["email"], self.admin_user.email)

    def test_unauthenticated_access_denied(self):
        """
        Test that unauthenticated requests are denied for protected endpoints.
        """
        url = reverse("user-self")
        response = self.client.get(url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )
