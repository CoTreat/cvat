# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

from unittest.mock import patch, MagicMock
from rest_framework import status
from cvat.apps.engine.models import Task, Project, Segment, Job, Data

from .base import BaseAPITestCase


class EventsAPITestCase(BaseAPITestCase):
    """
    Test event-related API endpoints, specifically the job history endpoint.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Set up test data for the entire TestCase.
        """
        super().setUpTestData()

        # Create a project
        cls.test_project = Project.objects.create(
            name="Test Project",
            owner=cls.admin_user,
            assignee=cls.admin_user
        )

        # Create a task
        task = Task.objects.create(
            name="Test Task",
            owner=cls.admin_user,
            assignee=cls.admin_user,
            project=cls.test_project
        )

        # Create task data
        data = Data.objects.create(
            size=10,
            chunk_size=10
        )
        task.data = data
        task.save()

        # Create a segment
        segment = Segment.objects.create(
            task=task,
            start_frame=0,
            stop_frame=9
        )

        # Create a job
        cls.test_job = Job.objects.create(
            segment=segment,
            assignee=cls.admin_user
        )

    def test_job_history_endpoint_requires_job_id(self):
        """
        Test that job_history endpoint requires job_id parameter.
        """
        url = "/api/events/job-history"
        response = self.authenticated_client.get(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_job_history_endpoint_validates_job_id_type(self):
        """
        Test that job_history endpoint validates job_id is an integer.
        """
        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": "invalid"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_returns_empty_list_when_no_history(self, mock_clickhouse):
        """
        Test that job_history endpoint returns empty list when no history exists.
        """
        # Mock ClickHouse client
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = []
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_parses_valid_json_assignee(self, mock_clickhouse):
        """
        Test that job_history endpoint correctly parses valid JSON assignee values.
        """
        from datetime import datetime

        # Mock ClickHouse client with valid JSON assignee
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = [
            (
                datetime(2024, 1, 1, 12, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "assignee",  # field_name
                '{"id": 2, "username": "owner1", "first_name": "Owner", "last_name": "One"}',  # new_value (valid JSON)
                None,  # old_value
            )
        ]
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["field_name"], "assignee")
        # Should be normalized to valid JSON string
        import json
        parsed_value = json.loads(response.data[0]["new_value"])
        self.assertEqual(parsed_value["username"], "owner1")

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_parses_python_string_assignee(self, mock_clickhouse):
        """
        Test that job_history endpoint correctly parses Python string representation (single quotes).
        """
        from datetime import datetime

        # Mock ClickHouse client with Python string representation
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = [
            (
                datetime(2024, 1, 1, 12, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "assignee",  # field_name
                "{'id': 2, 'username': 'owner1', 'first_name': 'Owner', 'last_name': 'One'}",  # new_value (Python string)
                None,  # old_value
            )
        ]
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["field_name"], "assignee")
        # Should be converted to valid JSON string
        import json
        parsed_value = json.loads(response.data[0]["new_value"])
        self.assertEqual(parsed_value["username"], "owner1")

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_handles_stage_and_state_fields(self, mock_clickhouse):
        """
        Test that job_history endpoint handles stage and state fields correctly.
        """
        from datetime import datetime

        # Mock ClickHouse client with stage and state changes
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = [
            (
                datetime(2024, 1, 1, 12, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "stage",  # field_name
                "validation",  # new_value
                "annotation",  # old_value
            ),
            (
                datetime(2024, 1, 1, 13, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "state",  # field_name
                "in_progress",  # new_value
                "new",  # old_value
            )
        ]
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check stage change
        stage_record = next(r for r in response.data if r["field_name"] == "stage")
        self.assertEqual(stage_record["new_value"], "validation")
        self.assertEqual(stage_record["old_value"], "annotation")

        # Check state change
        state_record = next(r for r in response.data if r["field_name"] == "state")
        self.assertEqual(state_record["new_value"], "in_progress")
        self.assertEqual(state_record["old_value"], "new")

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_parses_old_value_assignee(self, mock_clickhouse):
        """
        Test that job_history endpoint correctly parses old_value assignee fields.
        """
        from datetime import datetime

        # Mock ClickHouse client with old_value as Python string
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = [
            (
                datetime(2024, 1, 1, 12, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "assignee",  # field_name
                '{"id": 3, "username": "newuser"}',  # new_value (valid JSON)
                "{'id': 2, 'username': 'olduser'}",  # old_value (Python string)
            )
        ]
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Both old_value and new_value should be valid JSON
        import json
        old_parsed = json.loads(response.data[0]["old_value"])
        new_parsed = json.loads(response.data[0]["new_value"])
        self.assertEqual(old_parsed["username"], "olduser")
        self.assertEqual(new_parsed["username"], "newuser")

    @patch('cvat.apps.events.views.clickhouse_connect')
    def test_job_history_endpoint_handles_non_assignee_fields_unchanged(self, mock_clickhouse):
        """
        Test that non-assignee fields are not modified by parsing logic.
        """
        from datetime import datetime

        # Mock ClickHouse client with non-assignee field containing Python string
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.result_rows = [
            (
                datetime(2024, 1, 1, 12, 0, 0),  # timestamp
                1,  # user_id
                "testuser",  # user_name
                "stage",  # field_name (not assignee)
                "{'some': 'value'}",  # new_value (Python string, but not assignee field)
                None,  # old_value
            )
        ]
        mock_client.query.return_value = mock_result
        mock_clickhouse.get_client.return_value.__enter__.return_value = mock_client

        url = "/api/events/job-history"
        response = self.authenticated_client.get(url, {"job_id": self.test_job.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        # Non-assignee fields should remain unchanged
        self.assertEqual(response.data[0]["new_value"], "{'some': 'value'}")

    def test_job_history_endpoint_requires_authentication(self):
        """
        Test that job_history endpoint requires authentication.
        """
        url = "/api/events/job-history"
        response = self.client.get(url, {"job_id": self.test_job.id})

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

