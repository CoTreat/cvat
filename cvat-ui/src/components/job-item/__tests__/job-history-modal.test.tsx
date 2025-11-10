// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock cvat-core-wrapper - must be declared before importing the component
const mockGetJobHistory = jest.fn();
jest.mock('cvat-core-wrapper', () => ({
    getCore: jest.fn(() => ({
        analytics: {
            events: {
                getJobHistory: (...args: any[]) => mockGetJobHistory(...args),
            },
        },
    })),
}));

import JobHistoryModal from '../job-history-modal';

// Mock antd components
jest.mock('antd/lib/modal', () => {
    const actual = jest.requireActual('antd/lib/modal');
    return function MockModal({ children, open, onOk, onCancel, title }: any) {
        if (!open) return null;
        return (
            <div data-testid='job-history-modal'>
                <div data-testid='modal-title'>{title}</div>
                <div data-testid='modal-content'>{children}</div>
                <button data-testid='modal-close' onClick={onCancel}>
                    Cancel
                </button>
                <button data-testid='modal-ok' onClick={onOk}>
                    OK
                </button>
            </div>
        );
    };
});

jest.mock('antd/lib/table', () => {
    const actual = jest.requireActual('antd/lib/table');
    return function MockTable({ dataSource, columns, loading }: any) {
        if (loading) {
            return <div data-testid='table-loading'>Loading...</div>;
        }
        if (!dataSource || dataSource.length === 0) {
            return <div data-testid='table-empty'>No data</div>;
        }
        return (
            <table data-testid='history-table'>
                <thead>
                    <tr>
                        {columns.map((col: any) => (
                            <th key={col.key}>{col.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataSource.map((record: any, idx: number) => (
                        <tr key={idx}>
                            {columns.map((col: any) => (
                                <td key={col.key}>
                                    {col.render
                                        ? col.render(record[col.dataIndex], record)
                                        : record[col.dataIndex]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };
});

jest.mock('antd/lib/spin', () => {
    return function MockSpin({ spinning, children }: any) {
        return (
            <div data-testid='spin' data-spinning={spinning}>
                {children}
            </div>
        );
    };
});

jest.mock('antd/lib/notification', () => ({
    error: jest.fn(),
}));

jest.mock('antd/lib/typography/Text', () => {
    return function MockText({ children }: any) {
        return <span>{children}</span>;
    };
});

jest.mock('moment', () => {
    const actualMoment = jest.requireActual('moment');
    return (date?: any) => {
        if (date) {
            return actualMoment(date);
        }
        return actualMoment('2024-01-01T12:00:00Z');
    };
});

describe('JobHistoryModal', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when visible is false', () => {
        render(
            <JobHistoryModal
                jobId={1}
                visible={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByTestId('job-history-modal')).not.toBeInTheDocument();
    });

    it('should render modal when visible is true', async () => {
        mockGetJobHistory.mockResolvedValue([]);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        expect(screen.getByTestId('job-history-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Job #1 - Change History');
    });

    it('should fetch job history when modal opens', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'stage',
                old_value: 'annotation',
                new_value: 'validation',
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(mockGetJobHistory).toHaveBeenCalledWith(1);
        });
    });

    it('should display loading state while fetching', async () => {
        mockGetJobHistory.mockImplementation(() => new Promise(() => {})); // Never resolves

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'true');
    });

    it('should display empty message when no history', async () => {
        mockGetJobHistory.mockResolvedValue([]);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('No status changes recorded for this job.')).toBeInTheDocument();
        });
    });

    it('should display history table with data', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'stage',
                old_value: 'annotation',
                new_value: 'validation',
            },
            {
                timestamp: '2024-01-01T13:00:00Z',
                user_id: 2,
                user_name: 'anotheruser',
                field_name: 'state',
                old_value: 'new',
                new_value: 'in_progress',
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByTestId('history-table')).toBeInTheDocument();
        });

        // Check that field names are displayed with labels
        expect(screen.getByText('Stage')).toBeInTheDocument();
        expect(screen.getByText('State')).toBeInTheDocument();

        // Check that values are displayed
        expect(screen.getByText('validation')).toBeInTheDocument();
        expect(screen.getByText('annotation')).toBeInTheDocument();
        expect(screen.getByText('in_progress')).toBeInTheDocument();
        expect(screen.getByText('new')).toBeInTheDocument();
    });

    it('should extract username from assignee object', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'assignee',
                old_value: null,
                new_value: { id: 2, username: 'owner1', first_name: 'Owner', last_name: 'One' },
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('owner1')).toBeInTheDocument();
        });
    });

    it('should extract username from assignee JSON string', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'assignee',
                old_value: null,
                new_value: '{"id": 2, "username": "owner1", "first_name": "Owner", "last_name": "One"}',
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('owner1')).toBeInTheDocument();
        });
    });

    it('should handle error when fetching history fails', async () => {
        const notification = require('antd/lib/notification');
        const mockError = new Error('Failed to fetch');
        mockGetJobHistory.mockRejectedValue(mockError);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(notification.error).toHaveBeenCalledWith({
                message: 'Failed to load job history',
                description: 'Failed to fetch',
            });
        });
    });

    it('should format boolean values correctly', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'some_field',
                old_value: false,
                new_value: true,
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('True')).toBeInTheDocument();
            expect(screen.getByText('False')).toBeInTheDocument();
        });
    });

    it('should format null values as None', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'assignee',
                old_value: null,
                new_value: { id: 2, username: 'owner1' },
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('None')).toBeInTheDocument();
        });
    });

    it('should call onClose when close button is clicked', async () => {
        mockGetJobHistory.mockResolvedValue([]);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        const closeButton = screen.getByTestId('modal-close');
        await act(async () => {
            closeButton.click();
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when OK button is clicked', async () => {
        mockGetJobHistory.mockResolvedValue([]);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        const okButton = screen.getByTestId('modal-ok');
        await act(async () => {
            okButton.click();
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should refetch when jobId changes', async () => {
        mockGetJobHistory.mockResolvedValue([]);

        const { rerender } = await act(async () => {
            return render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(mockGetJobHistory).toHaveBeenCalledWith(1);
        });

        jest.clearAllMocks();

        await act(async () => {
            rerender(
                <JobHistoryModal
                    jobId={2}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(mockGetJobHistory).toHaveBeenCalledWith(2);
        });
    });

    it('should handle assignee object without username field', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'assignee',
                old_value: null,
                new_value: { id: 2, name: 'Some Name' }, // No username field
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            // Should display [object Object] since no username field and String() is called
            expect(screen.getByText('[object Object]')).toBeInTheDocument();
        });
    });

    it('should handle invalid JSON string for assignee', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'assignee',
                old_value: null,
                new_value: 'not a valid json string', // Invalid JSON
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            // Should return the value as-is when JSON parsing fails
            expect(screen.getByText('not a valid json string')).toBeInTheDocument();
        });
    });

    it('should handle number values', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: 1,
                user_name: 'testuser',
                field_name: 'some_field',
                old_value: 10,
                new_value: 20,
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('20')).toBeInTheDocument();
        });
    });

    it('should display Unknown for null user_name', async () => {
        const mockHistoryData = [
            {
                timestamp: '2024-01-01T12:00:00Z',
                user_id: null,
                user_name: null,
                field_name: 'stage',
                old_value: 'annotation',
                new_value: 'validation',
            },
        ];

        mockGetJobHistory.mockResolvedValue(mockHistoryData);

        await act(async () => {
            render(
                <JobHistoryModal
                    jobId={1}
                    visible={true}
                    onClose={mockOnClose}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });
});

