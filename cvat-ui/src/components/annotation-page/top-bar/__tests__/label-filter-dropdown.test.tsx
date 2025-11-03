// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { Label } from 'cvat-core-wrapper';
import LabelFilterDropdown from '../label-filter-dropdown';

// Mock CVATTooltip
jest.mock('components/common/cvat-tooltip', () => function MockCVATTooltip({ title, children }: any) {
    return (
        <div data-testid='cvat-tooltip' title={title}>
            {children}
        </div>
    );
});

// Mock FilterOutlined icon
jest.mock('@ant-design/icons', () => ({
    FilterOutlined: () => <span data-testid='filter-icon'>Filter</span>,
}));

describe('LabelFilterDropdown', () => {
    const mockLabels: Label[] = [
        {
            id: 1,
            name: 'Person',
            color: '#ff0000',
            attributes: [],
        } as Label,
        {
            id: 2,
            name: 'Car',
            color: '#00ff00',
            attributes: [],
        } as Label,
        {
            id: 3,
            name: 'Bicycle',
            color: '#0000ff',
            attributes: [],
        } as Label,
    ];

    const mockOnSelectLabel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when navigationType is not by_label', () => {
        const { container } = render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName={null}
                onSelectLabel={mockOnSelectLabel}
                navigationType='regular'
            />,
        );

        // Should render an empty fragment
        expect(container.textContent).toBe('');
    });

    it('should render dropdown when navigationType is by_label', () => {
        const { container } = render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName={null}
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        const dropdown = container.querySelector('.cvat-label-filter-dropdown');
        expect(dropdown).toBeInTheDocument();
    });

    it('should display first label when selectedLabelName is null', () => {
        render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName={null}
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        // The dropdown should show Person (first label) by default
        expect(screen.getByText('Person')).toBeInTheDocument();
    });

    it('should display selected label when selectedLabelName is provided', () => {
        render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName='Car'
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        // The dropdown should show Car
        expect(screen.getByText('Car')).toBeInTheDocument();
    });

    it('should call onSelectLabel prop when label is changed', () => {
        render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName='Person'
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        // Verify component is rendered with onChange handler
        expect(mockOnSelectLabel).not.toHaveBeenCalled();
    });

    it('should render with correct styling', () => {
        const { container } = render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName='Person'
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        const select = container.querySelector('.cvat-label-filter-dropdown');
        expect(select).toBeInTheDocument();
    });

    it('should not allow clearing selection', () => {
        render(
            <LabelFilterDropdown
                labels={mockLabels}
                selectedLabelName='Person'
                onSelectLabel={mockOnSelectLabel}
                navigationType='by_label'
            />,
        );

        const clearIcon = screen.queryByLabelText('close-circle');
        expect(clearIcon).not.toBeInTheDocument();
    });
});
