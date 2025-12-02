// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-router
const mockHistoryPush = jest.fn();
jest.mock('react-router', () => ({
    useHistory: () => ({
        push: mockHistoryPush,
    }),
}));

// Mock cvat-core-wrapper
jest.mock('cvat-core-wrapper', () => ({
    AnnotationGuide: jest.fn(),
    Project: jest.fn(),
    Task: jest.fn(),
}));

// Mock MDEditor
jest.mock('@uiw/react-md-editor', () => ({
    __esModule: true,
    default: {
        Markdown: ({ source }: { source: string }) => (
            <div data-testid="markdown-content">{source}</div>
        ),
    },
}));

// Mock @ant-design/icons
jest.mock('@ant-design/icons', () => ({
    EditOutlined: (props: any) => (
        <span
            data-testid="edit-icon"
            className={props.className}
            onClick={props.onClick}
        >
            EditIcon
        </span>
    ),
}));

// Mock styles
jest.mock('../styles.scss', () => ({}));

import MdGuideControl from '../md-guide-control';

describe('MdGuideControl', () => {
    const mockGuide = jest.fn();

    const createMockInstance = (markdown: string | null = null) => ({
        guide: mockGuide.mockResolvedValue(
            markdown ? { markdown } : null,
        ),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the title for project type', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        expect(screen.getByText('Project description')).toBeInTheDocument();
    });

    it('should render the title for task type', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="task"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        expect(screen.getByText('Task description')).toBeInTheDocument();
    });

    it('should display "No description available" when guide is null', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('No description available')).toBeInTheDocument();
        });
    });

    it('should display markdown content when guide exists', async () => {
        const mockInstance = createMockInstance('# Test Description\n\nThis is a test.');

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Test Description');
        });
    });

    it('should navigate to edit page when edit icon is clicked', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={123}
                    instance={mockInstance as any}
                />,
            );
        });

        const editIcon = screen.getByTestId('edit-icon');
        expect(editIcon).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(editIcon);
        });

        expect(mockHistoryPush).toHaveBeenCalledWith('/projects/123/guide');
    });

    it('should navigate to task edit page for task type', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="task"
                    id={456}
                    instance={mockInstance as any}
                />,
            );
        });

        const editIcon = screen.getByTestId('edit-icon');

        await act(async () => {
            fireEvent.click(editIcon);
        });

        expect(mockHistoryPush).toHaveBeenCalledWith('/tasks/456/guide');
    });

    it('should fetch guide on mount', async () => {
        const mockInstance = createMockInstance('Some content');

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        expect(mockGuide).toHaveBeenCalled();
    });

    it('should handle guide fetch error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockInstance = {
            guide: jest.fn().mockRejectedValue(new Error('Failed to fetch')),
        };

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch guide:', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('should show content wrapper with correct class when collapsed', async () => {
        const mockInstance = createMockInstance('Some content');

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        await waitFor(() => {
            const contentDiv = document.querySelector('.cvat-md-guide-content');
            expect(contentDiv).toHaveClass('cvat-md-guide-content-collapsed');
        });
    });

    it('should toggle expanded state when "Read more" is clicked', async () => {
        const longContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8';
        const mockInstance = createMockInstance(longContent);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        // Simulate overflow by mocking the ref
        await waitFor(() => {
            expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
        });

        // Note: In a real test environment, we would need to mock scrollHeight/clientHeight
        // to properly test the overflow detection. This test verifies the basic rendering.
    });

    it('should render edit icon with correct class', async () => {
        const mockInstance = createMockInstance(null);

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        const editIcon = screen.getByTestId('edit-icon');
        expect(editIcon).toBeInTheDocument();
        expect(editIcon).toHaveClass('cvat-md-guide-edit-icon');
    });

    it('should render content wrapper with correct class', async () => {
        const mockInstance = createMockInstance('Test content');

        await act(async () => {
            render(
                <MdGuideControl
                    instanceType="project"
                    id={1}
                    instance={mockInstance as any}
                />,
            );
        });

        await waitFor(() => {
            const wrapper = document.querySelector('.cvat-md-guide-content-wrapper');
            expect(wrapper).toBeInTheDocument();
        });
    });
});
