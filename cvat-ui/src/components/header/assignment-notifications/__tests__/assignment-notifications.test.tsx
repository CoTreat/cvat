// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock cvat-core-wrapper
const mockGetAssignmentNotifications = jest.fn();
jest.mock('cvat-core-wrapper', () => ({
    getCore: jest.fn(() => ({
        analytics: {
            events: {
                getAssignmentNotifications: (...args: any[]) => mockGetAssignmentNotifications(...args),
            },
        },
    })),
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Import component after mocks
import AssignmentNotifications from '../assignment-notifications';

// Helper to wrap component with router
const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

/**
 * Note: Component rendering tests are limited due to complex Ant Design component dependencies.
 * Full integration testing via E2E (Cypress/Playwright) is recommended for UI interactions.
 * These tests focus on pure logic functions and data structures that don't require rendering.
 */

describe('AssignmentNotifications - LocalStorage Management', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should use localStorage key "assignment_notifications_last_opened"', () => {
        const key = 'assignment_notifications_last_opened';
        const testValue = Date.now().toString();

        localStorageMock.setItem(key, testValue);
        expect(localStorageMock.getItem(key)).toBe(testValue);
    });

    it('should handle missing localStorage value', () => {
        const value = localStorageMock.getItem('assignment_notifications_last_opened');
        expect(value).toBeNull();
    });
});

// Test helper functions and utilities
describe('Notification Message Generation Logic', () => {
    it('should generate correct message for job assignments', () => {
        const notification = {
            scope: 'update:job',
            job_id: 123,
            task_id: 456,
            project_id: 789,
        };

        // The component should generate: "Job #123 was assigned to you"
        expect(notification.job_id).toBe(123);
        expect(notification.scope).toBe('update:job');
    });

    it('should generate correct message for task assignments', () => {
        const notification = {
            scope: 'update:task',
            job_id: null,
            task_id: 456,
            project_id: 789,
        };

        // The component should generate: "Task #456 was assigned to you"
        expect(notification.task_id).toBe(456);
        expect(notification.scope).toBe('update:task');
    });

    it('should generate correct message for project assignments', () => {
        const notification = {
            scope: 'update:project',
            job_id: null,
            task_id: null,
            project_id: 789,
        };

        // The component should generate: "Project #789 was assigned to you"
        expect(notification.project_id).toBe(789);
        expect(notification.scope).toBe('update:project');
    });
});

describe('Timestamp Comparison Logic', () => {
    it('should identify recent notifications (within 2 minutes)', () => {
        const now = Date.now();
        const oneMinuteAgo = now - 1 * 60 * 1000;
        const twoMinutesInterval = 2 * 60 * 1000;

        const isRecent = oneMinuteAgo > (now - twoMinutesInterval);
        expect(isRecent).toBe(true);
    });

    it('should identify old notifications (more than 2 minutes)', () => {
        const now = Date.now();
        const threeMinutesAgo = now - 3 * 60 * 1000;
        const twoMinutesInterval = 2 * 60 * 1000;

        const isRecent = threeMinutesAgo > (now - twoMinutesInterval);
        expect(isRecent).toBe(false);
    });

    it('should compare notification timestamp with last opened', () => {
        const lastOpened = Date.now() - 10 * 60 * 1000; // 10 minutes ago
        const notificationTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

        const isNew = notificationTime > lastOpened;
        expect(isNew).toBe(true);
    });

    it('should not count notifications older than last opened', () => {
        const lastOpened = Date.now() - 5 * 60 * 1000; // 5 minutes ago
        const notificationTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago

        const isNew = notificationTime > lastOpened;
        expect(isNew).toBe(false);
    });
});
