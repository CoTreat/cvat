# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from django.urls import reverse
from rest_framework import status
from cvat.apps.engine.models import Project, Label

from .base import BaseAPITestCase


class ProjectsAPITestCase(BaseAPITestCase):
    """
    Test project-related API endpoints using Django's TestCase.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase.
        """
        super().setUpTestData()

        # Create sample projects
        cls.project1 = Project.objects.create(
            name="Test Project 1",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        cls.project2 = Project.objects.create(
            name="Test Project 2",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        cls.project3 = Project.objects.create(
            name="Test Project 3",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        # Add labels to project1
        Label.objects.create(
            name="person",
            color="#ff0000",
            project=cls.project1
        )
        Label.objects.create(
            name="car",
            color="#00ff00",
            project=cls.project1
        )

    def test_list_projects(self):
        """
        Test listing projects.
        """
        url = reverse("project-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 3)

    def test_create_project(self):
        """
        Test creating a new project.
        """
        url = reverse("project-list")
        data = {
            "name": "New Test Project",
            "labels": [
                {"name": "label1", "color": "#ff0000"},
                {"name": "label2", "color": "#00ff00"}
            ]
        }

        response = self.authenticated_client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Test Project")

        # Verify project was created in database
        project = Project.objects.get(name="New Test Project")
        self.assertEqual(project.owner, self.admin_user)

    def test_retrieve_project_detail(self):
        """
        Test retrieving a specific project's details.
        """
        url = reverse("project-detail", kwargs={"pk": self.project1.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.project1.name)
        self.assertEqual(response.data["id"], self.project1.id)

    def test_update_project(self):
        """
        Test updating a project.
        """
        url = reverse("project-detail", kwargs={"pk": self.project1.id})
        data = {
            "name": "Updated Project Name"
        }

        response = self.authenticated_client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.project1.refresh_from_db()
        self.assertEqual(self.project1.name, "Updated Project Name")

    def test_delete_project(self):
        """
        Test deleting a project.
        """
        project_id = self.project2.id
        url = reverse("project-detail", kwargs={"pk": project_id})

        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify project was deleted
        self.assertFalse(Project.objects.filter(id=project_id).exists())

    def test_unauthenticated_cannot_create_project(self):
        """
        Test that unauthenticated users cannot create projects.
        """
        url = reverse("project-list")
        data = {
            "name": "Unauthorized Project"
        }

        response = self.client.post(url, data, format="json")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )
