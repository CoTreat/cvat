# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user_data():
    """
    Provides sample user data for testing.
    """
    return {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
def admin_data():
    """
    Provides sample admin user data for testing.
    """
    return {
        "username": "adminuser",
        "email": "admin@example.com",
        "password": "adminpass123",
        "first_name": "Admin",
        "last_name": "User"
    }


@pytest.fixture
def multiple_users(db):
    """
    Creates multiple users for testing list operations and permissions.
    """
    users = []
    for i in range(5):
        user = User.objects.create_user(
            username=f"user{i}",
            email=f"user{i}@example.com",
            password="testpass123",
            first_name=f"User{i}",
            last_name="Test"
        )
        users.append(user)
    return users
