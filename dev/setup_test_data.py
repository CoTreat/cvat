#!/usr/bin/env python3
"""
Script to set up test organizations and users for local CVAT development.

Usage:
    python setup_test_data.py

This creates:
- 1 superuser (admin/admin) - already exists
- 5 regular users with different roles
- 2 organizations with members
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cvat.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from cvat.apps.organizations.models import Organization, Membership

User = get_user_model()

def create_users():
    """Create test users with different purposes."""
    users_data = [
        {'username': 'owner1', 'email': 'owner1@test.com', 'first_name': 'Owner', 'last_name': 'One'},
        {'username': 'maintainer1', 'email': 'maintainer1@test.com', 'first_name': 'Maintainer', 'last_name': 'One'},
        {'username': 'supervisor1', 'email': 'supervisor1@test.com', 'first_name': 'Supervisor', 'last_name': 'One'},
        {'username': 'worker1', 'email': 'worker1@test.com', 'first_name': 'Worker', 'last_name': 'One'},
        {'username': 'worker2', 'email': 'worker2@test.com', 'first_name': 'Worker', 'last_name': 'Two'},
    ]

    created_users = {}
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
            }
        )
        if created:
            user.set_password('test123')  # Default password for all test users
            user.save()
            print(f"✓ Created user: {user.username} (password: test123)")
        else:
            print(f"- User already exists: {user.username}")
        created_users[user_data['username']] = user

    return created_users

def create_organizations(users):
    """Create test organizations with members."""
    orgs_data = [
        {
            'slug': 'med-imaging',
            'name': 'Medical Imaging Team',
            'description': 'Organization for medical image annotation',
            'members': [
                {'user': 'owner1', 'role': 'owner'},
                {'user': 'maintainer1', 'role': 'maintainer'},
                {'user': 'supervisor1', 'role': 'supervisor'},
                {'user': 'worker1', 'role': 'worker'},
            ]
        },
        {
            'slug': 'auto-vehicles',
            'name': 'Autonomous Vehicles',
            'description': 'Organization for autonomous vehicle data annotation',
            'members': [
                {'user': 'owner1', 'role': 'owner'},
                {'user': 'supervisor1', 'role': 'supervisor'},
                {'user': 'worker1', 'role': 'worker'},
                {'user': 'worker2', 'role': 'worker'},
            ]
        }
    ]

    for org_data in orgs_data:
        org, created = Organization.objects.get_or_create(
            slug=org_data['slug'],
            defaults={
                'name': org_data['name'],
                'description': org_data['description'],
            }
        )
        if created:
            print(f"\n✓ Created organization: {org.name} ({org.slug})")
        else:
            print(f"\n- Organization already exists: {org.name} ({org.slug})")

        # Add members
        for member_data in org_data['members']:
            user = users[member_data['user']]
            membership, created = Membership.objects.get_or_create(
                organization=org,
                user=user,
                defaults={'role': member_data['role']}
            )
            if created:
                print(f"  ✓ Added {user.username} as {member_data['role']}")
            else:
                # Update role if it changed
                if membership.role != member_data['role']:
                    membership.role = member_data['role']
                    membership.save()
                    print(f"  ✓ Updated {user.username} to {member_data['role']}")
                else:
                    print(f"  - {user.username} already {member_data['role']}")

def print_summary():
    """Print summary of all users and organizations."""
    print("\n" + "="*60)
    print("TEST DATA SETUP COMPLETE")
    print("="*60)

    print("\n📋 USERS (all with password: test123):")
    print("-" * 60)
    for user in User.objects.all().order_by('username'):
        memberships = Membership.objects.filter(user=user)
        if memberships.exists():
            roles = [f"{m.organization.slug}:{m.role}" for m in memberships]
            print(f"  • {user.username:15} - {', '.join(roles)}")
        else:
            superuser = " (superuser)" if user.is_superuser else ""
            print(f"  • {user.username:15}{superuser}")

    print("\n🏢 ORGANIZATIONS:")
    print("-" * 60)
    for org in Organization.objects.all():
        print(f"\n  {org.name} ({org.slug})")
        print(f"  {org.description}")
        print("  Members:")
        for membership in Membership.objects.filter(organization=org).select_related('user'):
            print(f"    • {membership.user.username:15} - {membership.role}")

    print("\n" + "="*60)
    print("🚀 LOGIN CREDENTIALS:")
    print("="*60)
    print("  Admin:      admin / admin")
    print("  Test users: <username> / test123")
    print("\n  Access CVAT at: http://localhost:8080")
    print("="*60 + "\n")

if __name__ == '__main__':
    print("Setting up test data for CVAT...\n")

    # Create users
    users = create_users()

    # Create organizations and assign members
    create_organizations(users)

    # Print summary
    print_summary()
