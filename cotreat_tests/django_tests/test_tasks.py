# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from django.urls import reverse
from rest_framework import status
from cvat.apps.engine.models import Task, Project, Segment, Job, Data

from .base import BaseAPITestCase


class TasksAPITestCase(BaseAPITestCase):
    """
    Test task-related API endpoints using Django's TestCase.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase.
        """
        super().setUpTestData()

        # Create a project for tasks
        cls.test_project = Project.objects.create(
            name="Test Project for Tasks",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        # Create sample tasks
        cls.task1 = cls._create_task("Task 1", cls.admin_user)
        cls.task2 = cls._create_task("Task 2", cls.admin_user)
        cls.task3 = cls._create_task("Task 3", cls.admin_user, cls.test_project)

    @classmethod
    def _create_task(cls, name, owner, project=None):
        """
        Helper method to create a task with required relationships.
        """
        task = Task.objects.create(
            name=name,
            owner=owner,
            assignee=owner,
            project=project
        )

        # Create task data
        data = Data.objects.create(
            size=10,
            chunk_size=10
        )
        task.data = data
        task.save()

        # Create a segment for the task
        segment = Segment.objects.create(
            task=task,
            start_frame=0,
            stop_frame=9
        )

        # Create jobs for the task
        Job.objects.create(
            segment=segment,
            assignee=owner
        )

        return task

    def test_list_tasks(self):
        """
        Test listing tasks.
        """
        url = reverse("task-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 3)

    def test_retrieve_task_detail(self):
        """
        Test retrieving a specific task's details.
        """
        url = reverse("task-detail", kwargs={"pk": self.task1.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.task1.name)
        self.assertEqual(response.data["id"], self.task1.id)

    def test_update_task(self):
        """
        Test updating a task.
        """
        url = reverse("task-detail", kwargs={"pk": self.task1.id})
        data = {
            "name": "Updated Task Name"
        }

        response = self.authenticated_client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.task1.refresh_from_db()
        self.assertEqual(self.task1.name, "Updated Task Name")

    def test_delete_task(self):
        """
        Test deleting a task.
        """
        task_id = self.task2.id
        url = reverse("task-detail", kwargs={"pk": task_id})

        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify task was deleted
        self.assertFalse(Task.objects.filter(id=task_id).exists())

    def test_task_with_project_relationship(self):
        """
        Test that tasks maintain proper relationship with projects.
        """
        url = reverse("task-detail", kwargs={"pk": self.task3.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["project_id"], self.test_project.id)

    def test_filter_tasks_by_project(self):
        """
        Test filtering tasks by project.
        """
        url = reverse("task-list")
        response = self.authenticated_client.get(url, {"project_id": self.test_project.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        # At least one task should belong to the project
        project_tasks = [
            t for t in response.data["results"]
            if t.get("project_id") == self.test_project.id
        ]
        self.assertGreater(len(project_tasks), 0)

    def test_unauthenticated_cannot_access_tasks(self):
        """
        Test that unauthenticated users cannot access tasks.
        """
        url = reverse("task-list")
        response = self.client.get(url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_task_with_project_has_project_name(self):
        """
        Test that a task associated with a project returns the project_name field.

        This verifies the change from commit 5823a367 where project_name was added
        to the task serializer.
        """
        url = reverse("task-detail", kwargs={"pk": self.task3.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.task3.id)

        # Verify project_name is present and correct
        self.assertIn("project_name", response.data)
        self.assertEqual(response.data["project_name"], "Test Project for Tasks")

        # Verify project_id is also present
        self.assertEqual(response.data["project_id"], self.test_project.id)

    def test_task_without_project_has_null_project_name(self):
        """
        Test that a task NOT associated with a project has null project_name.

        This verifies that project_name is optional and handles the case where
        a task is not part of any project (project is optional).
        """
        url = reverse("task-detail", kwargs={"pk": self.task1.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.task1.id)

        # Verify project_name is present but null
        self.assertIn("project_name", response.data)
        self.assertIsNone(response.data["project_name"])

        # Verify project_id is also null
        self.assertIsNone(response.data["project_id"])

    def test_task_list_includes_project_name(self):
        """
        Test that the task list endpoint includes project_name field.

        This verifies that the field is present in the list serializer as well
        as the detail serializer.
        """
        url = reverse("task-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

        # Find our test tasks in the results
        task_with_project_data = None
        task_without_project_data = None

        for task_data in response.data["results"]:
            if task_data["id"] == self.task3.id:
                task_with_project_data = task_data
            elif task_data["id"] == self.task1.id:
                task_without_project_data = task_data

        # Verify task with project has correct field
        if task_with_project_data:
            self.assertIn("project_name", task_with_project_data)
            self.assertEqual(task_with_project_data["project_name"], "Test Project for Tasks")

        # Verify task without project has correct field
        if task_without_project_data:
            self.assertIn("project_name", task_without_project_data)
            self.assertIsNone(task_without_project_data["project_name"])
