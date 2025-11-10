// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    Job, JobType, JobStage, JobState,
} from 'cvat-core-wrapper';
import JobBreadcrumb from '../job-breadcrumb';

// Mock CVATTooltip component
jest.mock('components/common/cvat-tooltip', () => function MockCVATTooltip({ title, children }: any) {
    return (
        <div data-testid='cvat-tooltip' title={title}>
            {children}
        </div>
    );
});

// Mock antd Breadcrumb component
jest.mock('antd', () => {
    const actual = jest.requireActual('antd');
    return {
        ...actual,
        Breadcrumb: Object.assign(
            function MockBreadcrumb({ children, className }: any) {
                return <nav className={className}>{children}</nav>;
            },
            {
                Item: function MockBreadcrumbItem({ children }: any) {
                    return <span className='breadcrumb-item'>{children}</span>;
                },
            },
        ),
    };
});

// Mock @ant-design/icons
jest.mock('@ant-design/icons', () => ({
    BookOutlined: () => <span>BookIcon</span>,
    CarryOutOutlined: () => <span>CarryOutIcon</span>,
    UserOutlined: () => <span>UserIcon</span>,
    AtOutlined: () => <span>AtIcon</span>,
    BorderlessTableOutlined: () => <span>BorderlessTableIcon</span>,
    HistoryOutlined: () => <span>HistoryIcon</span>,
}));

// Mock JobHistoryModal
jest.mock('../../../../job-item/job-history-modal', () => function MockJobHistoryModal() {
    return <div data-testid='job-history-modal'>Job History Modal</div>;
});

describe('JobBreadcrumb', () => {
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

    it('should render breadcrumb with all items when job has all properties', () => {
        const job = createMockJob({
            id: 123,
            projectName: 'My Project',
            taskName: 'My Task',
            stage: JobStage.ANNOTATION,
            assignee: { username: 'john_doe' },
        });

        render(<JobBreadcrumb job={job} />);

        expect(screen.getByText('My Project')).toBeInTheDocument();
        expect(screen.getByText('My Task')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('annotation')).toBeInTheDocument();
        expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    it('should not render project name breadcrumb item when job has no project', () => {
        const job = createMockJob({
            projectId: null,
            projectName: null,
            taskName: 'Task Without Project',
            stage: JobStage.VALIDATION,
            assignee: { username: 'jane_doe' },
        });

        render(<JobBreadcrumb job={job} />);

        expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
        expect(screen.getByText('Task Without Project')).toBeInTheDocument();
        expect(screen.getByText('validation')).toBeInTheDocument();
        expect(screen.getByText('jane_doe')).toBeInTheDocument();
    });

    it('should display "--" for task name when job has no task name', () => {
        const job = createMockJob({
            projectName: 'Some Project',
            taskName: null,
            stage: JobStage.ACCEPTANCE,
            assignee: { username: 'user123' },
        });

        render(<JobBreadcrumb job={job} />);

        expect(screen.getByText('Some Project')).toBeInTheDocument();
        expect(screen.getByText('--')).toBeInTheDocument();
        expect(screen.getByText('acceptance')).toBeInTheDocument();
        expect(screen.getByText('user123')).toBeInTheDocument();
    });

    it('should display "--" for assignee when job has no assignee', () => {
        const job = createMockJob({
            projectName: 'Project ABC',
            taskName: 'Task XYZ',
            stage: JobStage.ANNOTATION,
            assignee: null,
        });

        render(<JobBreadcrumb job={job} />);

        expect(screen.getByText('Project ABC')).toBeInTheDocument();
        expect(screen.getByText('Task XYZ')).toBeInTheDocument();
        expect(screen.getByText('annotation')).toBeInTheDocument();
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('should render tooltips with correct titles', () => {
        const job = createMockJob({
            projectName: 'Test Project',
            taskName: 'Test Task',
            stage: JobStage.ANNOTATION,
            assignee: { username: 'testuser' },
        });

        render(<JobBreadcrumb job={job} />);

        const tooltips = screen.getAllByTestId('cvat-tooltip');

        // When project exists, we expect 6 tooltips: Project, Task, Job ID, History, Assignee, Stage
        expect(tooltips.length).toBe(6);
        expect(tooltips[0]).toHaveAttribute('title', 'Project');
        expect(tooltips[1]).toHaveAttribute('title', 'Task');
        expect(tooltips[2]).toHaveAttribute('title', 'Job ID');
        expect(tooltips[3]).toHaveAttribute('title', 'View change history');
        expect(tooltips[4]).toHaveAttribute('title', 'Assignee');
        expect(tooltips[5]).toHaveAttribute('title', 'Stage');
    });

    it('should render 4 tooltips when project is absent', () => {
        const job = createMockJob({
            projectId: null,
            projectName: null,
            taskName: 'Solo Task',
            stage: JobStage.VALIDATION,
            assignee: { username: 'validator' },
        });

        render(<JobBreadcrumb job={job} />);

        const tooltips = screen.getAllByTestId('cvat-tooltip');

        // Without project, we expect 5 tooltips: Task, Job ID, History, Assignee, Stage
        expect(tooltips.length).toBe(5);
        expect(tooltips[0]).toHaveAttribute('title', 'Task');
        expect(tooltips[1]).toHaveAttribute('title', 'Job ID');
        expect(tooltips[2]).toHaveAttribute('title', 'View change history');
        expect(tooltips[3]).toHaveAttribute('title', 'Assignee');
        expect(tooltips[4]).toHaveAttribute('title', 'Stage');
    });

    it('should display job ID', () => {
        const job = createMockJob({
            id: 456,
            projectName: 'Test Project',
            taskName: 'Test Task',
            stage: JobStage.ANNOTATION,
            assignee: { username: 'testuser' },
        });

        render(<JobBreadcrumb job={job} />);

        expect(screen.getByText('456')).toBeInTheDocument();
    });

    it('should return null when job is null', () => {
        const { container } = render(<JobBreadcrumb job={null} />);

        expect(container.firstChild).toBeNull();
    });

    it('should return null when job is undefined', () => {
        const { container } = render(<JobBreadcrumb job={undefined} />);

        expect(container.firstChild).toBeNull();
    });

    it('should handle different job stages', () => {
        const stages = [
            JobStage.ANNOTATION,
            JobStage.VALIDATION,
            JobStage.ACCEPTANCE,
        ];

        stages.forEach((stage) => {
            const job = createMockJob({
                projectName: 'Project',
                taskName: 'Task',
                stage,
                assignee: { username: 'user' },
            });

            const { unmount } = render(<JobBreadcrumb job={job} />);

            expect(screen.getByText(stage)).toBeInTheDocument();

            unmount();
        });
    });

    it('should render breadcrumb with correct CSS class', () => {
        const job = createMockJob({
            projectName: 'Project',
            taskName: 'Task',
            stage: JobStage.ANNOTATION,
            assignee: { username: 'user' },
        });

        const { container } = render(<JobBreadcrumb job={job} />);

        const breadcrumb = container.querySelector('.cvat-annotation-breadcrumb');
        expect(breadcrumb).toBeInTheDocument();
    });

    it('should handle multiple combinations of missing fields', () => {
        const testCases = [
            {
                description: 'missing project and assignee',
                props: {
                    projectId: null,
                    projectName: null,
                    taskName: 'Task',
                    stage: JobStage.ANNOTATION,
                    assignee: null,
                },
                expectedTexts: ['Task', 'annotation'],
                notExpectedTexts: ['Test Project'],
                placeholders: 1, // Only assignee shows "--"
            },
            {
                description: 'missing task name and assignee',
                props: {
                    projectName: 'Project',
                    taskName: null,
                    stage: JobStage.VALIDATION,
                    assignee: null,
                },
                expectedTexts: ['Project', 'validation'],
                notExpectedTexts: [],
                placeholders: 2, // Task and assignee show "--"
            },
            {
                description: 'all fields present',
                props: {
                    projectName: 'Full Project',
                    taskName: 'Full Task',
                    stage: JobStage.ACCEPTANCE,
                    assignee: { username: 'full_user' },
                },
                expectedTexts: ['Full Project', 'Full Task', 'acceptance', 'full_user'],
                notExpectedTexts: [],
                placeholders: 0, // No placeholders
            },
        ];

        testCases.forEach(({
            description, props, expectedTexts, notExpectedTexts, placeholders,
        }) => {
            const job = createMockJob(props);

            const { unmount } = render(<JobBreadcrumb job={job} />);

            expectedTexts.forEach((text) => {
                expect(screen.getByText(text)).toBeInTheDocument();
            });

            notExpectedTexts.forEach((text) => {
                expect(screen.queryByText(text)).not.toBeInTheDocument();
            });

            // Check for the correct number of placeholder "--"
            if (placeholders > 0) {
                const placeholderElements = screen.getAllByText('--');
                expect(placeholderElements).toHaveLength(placeholders);
            } else {
                expect(screen.queryByText('--')).not.toBeInTheDocument();
            }

            unmount();
        });
    });
});
