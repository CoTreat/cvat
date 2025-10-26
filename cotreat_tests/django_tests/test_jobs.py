# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from django.urls import reverse
from rest_framework import status
from cvat.apps.engine.models import Task, Project, Segment, Job, Data

from .base import BaseAPITestCase


class JobsAPITestCase(BaseAPITestCase):
    """
    Test job-related API endpoints using Django's TestCase.

    These tests verify that the job API correctly returns project_name and task_name
    fields as added in commit 5823a36735263cf47d437fbf8aa03ca79514d628.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase.
        """
        super().setUpTestData()

        # Create a project for testing job with project
        cls.test_project = Project.objects.create(
            name="Test Project for Jobs",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        # Create task WITH project
        cls.task_with_project = cls._create_task(
            "Task with Project",
            cls.admin_user,
            cls.test_project
        )

        # Create task WITHOUT project
        cls.task_without_project = cls._create_task(
            "Task without Project",
            cls.admin_user,
            None
        )

        # Get the jobs created by the helper method
        cls.job_with_project = Job.objects.get(segment__task=cls.task_with_project)
        cls.job_without_project = Job.objects.get(segment__task=cls.task_without_project)

    @classmethod
    def _create_task(cls, name, owner, project=None):
        """
        Helper method to create a task with required relationships and a job.
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

        # Create a job for the task
        Job.objects.create(
            segment=segment,
            assignee=owner
        )

        return task

    def test_list_jobs(self):
        """
        Test listing jobs returns successfully.
        """
        url = reverse("job-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 2)

    def test_job_with_project_has_project_name(self):
        """
        Test that a job associated with a project returns the project_name field.

        This verifies the change from commit 5823a367 where project_name was added
        to the job serializer.
        """
        url = reverse("job-detail", kwargs={"pk": self.job_with_project.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.job_with_project.id)

        # Verify project_name is present and correct
        self.assertIn("project_name", response.data)
        self.assertEqual(response.data["project_name"], "Test Project for Jobs")

        # Verify project_id is also present
        self.assertEqual(response.data["project_id"], self.test_project.id)

    def test_job_with_project_has_task_name(self):
        """
        Test that a job returns the task_name field.

        This verifies the change from commit 5823a367 where task_name was added
        to the job serializer.
        """
        url = reverse("job-detail", kwargs={"pk": self.job_with_project.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify task_name is present and correct
        self.assertIn("task_name", response.data)
        self.assertEqual(response.data["task_name"], "Task with Project")

        # Verify task_id is also present
        self.assertEqual(response.data["task_id"], self.task_with_project.id)

    def test_job_without_project_has_null_project_name(self):
        """
        Test that a job NOT associated with a project has null project_name.

        This verifies that project_name is optional and handles the case where
        a task is not part of any project (project is optional).
        """
        url = reverse("job-detail", kwargs={"pk": self.job_without_project.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.job_without_project.id)

        # Verify project_name is present but null
        self.assertIn("project_name", response.data)
        self.assertIsNone(response.data["project_name"])

        # Verify project_id is also null
        self.assertIsNone(response.data["project_id"])

    def test_job_without_project_has_task_name(self):
        """
        Test that a job without a project still returns the task_name field.

        This ensures task_name is always present regardless of project association.
        """
        url = reverse("job-detail", kwargs={"pk": self.job_without_project.id})
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify task_name is present and correct even without a project
        self.assertIn("task_name", response.data)
        self.assertEqual(response.data["task_name"], "Task without Project")

        # Verify task_id is present
        self.assertEqual(response.data["task_id"], self.task_without_project.id)

    def test_job_list_includes_project_and_task_names(self):
        """
        Test that the job list endpoint includes project_name and task_name fields.

        This verifies that the fields are present in the list serializer as well
        as the detail serializer.
        """
        url = reverse("job-list")
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

        # Find our test jobs in the results
        job_with_project_data = None
        job_without_project_data = None

        for job_data in response.data["results"]:
            if job_data["id"] == self.job_with_project.id:
                job_with_project_data = job_data
            elif job_data["id"] == self.job_without_project.id:
                job_without_project_data = job_data

        # Verify job with project has correct fields
        if job_with_project_data:
            self.assertIn("project_name", job_with_project_data)
            self.assertEqual(job_with_project_data["project_name"], "Test Project for Jobs")
            self.assertIn("task_name", job_with_project_data)
            self.assertEqual(job_with_project_data["task_name"], "Task with Project")

        # Verify job without project has correct fields
        if job_without_project_data:
            self.assertIn("project_name", job_without_project_data)
            self.assertIsNone(job_without_project_data["project_name"])
            self.assertIn("task_name", job_without_project_data)
            self.assertEqual(job_without_project_data["task_name"], "Task without Project")

    def test_unauthenticated_cannot_access_jobs(self):
        """
        Test that unauthenticated users cannot access jobs.
        """
        url = reverse("job-list")
        response = self.client.get(url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )
