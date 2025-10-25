# Copyright (C) CoTreat Corporation
#
# SPDX-License-Identifier: MIT

import pytest
from cvat.apps.engine.models import Project, Label, Task
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def project_data():
    """
    Provides sample project data for testing.
    """
    return {
        "name": "Test Project",
        "labels": [
            {"name": "person", "color": "#ff0000"},
            {"name": "car", "color": "#00ff00"},
            {"name": "bike", "color": "#0000ff"}
        ]
    }


@pytest.fixture
def create_project(db, admin_user):
    """
    Factory fixture to create a project.
    """
    def _create_project(name="Test Project", owner=None):
        if owner is None:
            owner = admin_user

        project = Project.objects.create(
            name=name,
            owner=owner,
            assignee=owner
        )

        # Create some labels for the project
        labels_data = [
            {"name": "person", "color": "#ff0000"},
            {"name": "car", "color": "#00ff00"}
        ]

        for label_data in labels_data:
            Label.objects.create(
                name=label_data["name"],
                color=label_data["color"],
                project=project
            )

        return project

    return _create_project


@pytest.fixture
def sample_project(create_project):
    """
    Creates a single sample project for testing.
    """
    return create_project()


@pytest.fixture
def multiple_projects(create_project, admin_user):
    """
    Creates multiple projects for testing list operations.
    """
    projects = []
    for i in range(3):
        project = create_project(name=f"Project {i}", owner=admin_user)
        projects.append(project)
    return projects
