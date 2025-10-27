// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { createStore } from 'redux';
import '@testing-library/jest-dom';

import {
    Job, JobType, JobStage, JobState,
} from 'cvat-core-wrapper';
import JobCardComponent from '../job-card';

// Mock the modules that job-card depends on
jest.mock('utils/hooks', () => ({
    useCardHeightHOC: () => () => 200,
}));

jest.mock('components/common/preview', () => function MockPreview() {
    return <div data-testid='job-preview'>Preview</div>;
});

jest.mock('../actions-menu', () => function MockJobActions() {
    return <div data-testid='job-actions'>Actions</div>;
});

// Create a mock store
const createMockStore = (initialState = {}) => {
    const defaultState = {
        jobs: {
            activities: {
                deletes: {},
            },
        },
        ...initialState,
    };

    return createStore(() => defaultState);
};

describe('JobCardComponent', () => {
    const history = createMemoryHistory();

    const createMockJob = (overrides = {}): Job => {
        const defaultJob = {
            id: 1,
            taskId: 10,
            taskName: 'Test Task',
            projectId: 5,
            projectName: 'Test Project',
            stage: JobStage.ANNOTATION,
            state: JobState.NEW,
            startFrame: 0,
            stopFrame: 99,
            assignee: { username: 'testuser' },
            type: JobType.ANNOTATION,
            dimension: '2d',
            consensusReplicas: 0,
            ...overrides,
        };

        return new Job(defaultJob);
    };

    it('should render job card with task name', () => {
        const job = createMockJob();
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Check that task name is displayed
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display project name in tooltip when job has a project', () => {
        const job = createMockJob({
            projectName: 'My Awesome Project',
            taskName: 'My Task',
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Check that the tooltip content contains project name
        // The tooltip content is rendered in the DOM even before hover
        expect(screen.getByText(/Project:/)).toBeInTheDocument();
        expect(screen.getByText(/My Awesome Project/)).toBeInTheDocument();
    });

    it('should display "--" for project name when job has no project', () => {
        const job = createMockJob({
            projectId: null,
            projectName: null,
            taskName: 'Task Without Project',
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Check that task name is displayed
        expect(screen.getByText('Task Without Project')).toBeInTheDocument();

        // Check that project is shown as "--"
        expect(screen.getByText(/Project:/)).toBeInTheDocument();
        expect(screen.getByText(/--/)).toBeInTheDocument();
    });

    it('should display task name in tooltip', () => {
        const job = createMockJob({
            taskName: 'Important Annotation Task',
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Check tooltip has task name - use getAllByText since it appears twice
        expect(screen.getByText(/Task:/)).toBeInTheDocument();
        const taskNameElements = screen.getAllByText(/Important Annotation Task/);
        expect(taskNameElements.length).toBeGreaterThan(0);
    });

    it('should display job stage and state', () => {
        const job = createMockJob({
            stage: JobStage.VALIDATION,
            state: JobState.IN_PROGRESS,
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Check that stage and state are displayed
        expect(screen.getByText('validation')).toBeInTheDocument();
        expect(screen.getByText('in progress')).toBeInTheDocument();
    });

    it('should display assignee when present', () => {
        const job = createMockJob({
            assignee: { username: 'john_doe' },
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    it('should display frame count', () => {
        const job = createMockJob({
            startFrame: 0,
            stopFrame: 49,
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        // Frame count = stopFrame - startFrame + 1 = 49 - 0 + 1 = 50
        expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should display ground truth tag for ground truth jobs', () => {
        const job = createMockJob({
            type: JobType.GROUND_TRUTH,
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        expect(screen.getByText('Ground truth')).toBeInTheDocument();
    });

    it('should display consensus tag for consensus jobs', () => {
        const job = createMockJob({
            type: JobType.ANNOTATION,
            consensusReplicas: 2,
        });
        const store = createMockStore();

        render(
            <Provider store={store}>
                <Router history={history}>
                    <JobCardComponent job={job} />
                </Router>
            </Provider>,
        );

        expect(screen.getByText('Consensus')).toBeInTheDocument();
    });

    it('should handle jobs with different project and task combinations', () => {
        const testCases = [
            {
                projectName: 'Project A',
                taskName: 'Task 1',
                expectedProject: 'Project A',
            },
            {
                projectName: null,
                taskName: 'Task 2',
                expectedProject: '--',
            },
            {
                projectName: 'Another Project',
                taskName: 'Another Task',
                expectedProject: 'Another Project',
            },
        ];

        testCases.forEach(({ projectName, taskName, expectedProject }) => {
            const job = createMockJob({
                projectId: projectName ? 1 : null,
                projectName,
                taskName,
            });
            const store = createMockStore();

            const { unmount } = render(
                <Provider store={store}>
                    <Router history={history}>
                        <JobCardComponent job={job} />
                    </Router>
                </Provider>,
            );

            // Verify task name
            expect(screen.getByText(taskName)).toBeInTheDocument();

            // Verify project name or placeholder
            expect(screen.getByText(new RegExp(expectedProject))).toBeInTheDocument();

            unmount();
        });
    });
});
