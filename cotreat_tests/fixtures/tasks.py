# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

import pytest
from cvat.apps.engine.models import Task, Project, Segment, Job, Data
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def task_data():
    """
    Provides sample task data for testing.
    """
    return {
        "name": "Test Task",
        "subset": "train",
        "segment_size": 100,
    }


@pytest.fixture
def create_task(db, admin_user):
    """
    Factory fixture to create a task.
    """
    def _create_task(name="Test Task", owner=None, project=None):
        if owner is None:
            owner = admin_user

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
        job = Job.objects.create(
            segment=segment,
            assignee=owner
        )

        return task

    return _create_task


@pytest.fixture
def sample_task(create_task):
    """
    Creates a single sample task for testing.
    """
    return create_task()


@pytest.fixture
def multiple_tasks(create_task, admin_user):
    """
    Creates multiple tasks for testing list operations.
    """
    tasks = []
    for i in range(3):
        task = create_task(name=f"Task {i}", owner=admin_user)
        tasks.append(task)
    return tasks


@pytest.fixture
def task_with_project(create_task, sample_project):
    """
    Creates a task associated with a project.
    """
    return create_task(name="Task with Project", project=sample_project)
