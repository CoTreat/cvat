// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { NavigationType, Workspace } from 'reducers';
import PlayerButtons from '../player-buttons';

// Mock CVATTooltip
jest.mock('components/common/cvat-tooltip', () => function MockCVATTooltip({ title, children, placement }: any) {
    return (
        <div data-testid='cvat-tooltip' title={title} data-placement={placement}>
            {children}
        </div>
    );
});

// Mock GlobalHotKeys
jest.mock('utils/mousetrap-react', () => ({
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>,
}));

describe('PlayerButtons - BY_LABEL Navigation', () => {
    const defaultProps = {
        playing: false,
        playPauseShortcut: 'space',
        nextFrameShortcut: 'f',
        previousFrameShortcut: 'd',
        forwardShortcut: 'v',
        backwardShortcut: 'c',
        keyMap: {},
        workspace: Workspace.STANDARD,
        navigationType: NavigationType.REGULAR,
        onSwitchPlay: jest.fn(),
        onPrevFrame: jest.fn(),
        onNextFrame: jest.fn(),
        onForward: jest.fn(),
        onBackward: jest.fn(),
        onFirstFrame: jest.fn(),
        onLastFrame: jest.fn(),
        onSearchAnnotations: jest.fn(),
        setNavigationType: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show BY_LABEL option in previous button popover', async () => {
        const user = userEvent.setup();

        render(<PlayerButtons {...defaultProps} />);

        // Find the previous button popover wrapper
        const popoverWrappers = screen.getAllByTestId('popover-wrapper');
        // The first popover should be for the previous button (after backward button)
        const prevPopoverWrapper = popoverWrappers[0];

        expect(prevPopoverWrapper).toBeInTheDocument();

        // Right-click to open popover
        fireEvent.contextMenu(prevPopoverWrapper);

        // Wait for popover to open and check for BY_LABEL option
        const labelOption = await screen.findByTitle('Go back with selected label');
        expect(labelOption).toBeInTheDocument();
    });

    it('should show BY_LABEL option in next button popover', async () => {
        const user = userEvent.setup();

        render(<PlayerButtons {...defaultProps} />);

        // Find the next button popover wrapper
        const popoverWrappers = screen.getAllByTestId('popover-wrapper');
        // The second popover should be for the next button
        const nextPopoverWrapper = popoverWrappers[1];

        expect(nextPopoverWrapper).toBeInTheDocument();

        // Right-click to open popover
        fireEvent.contextMenu(nextPopoverWrapper);

        // Wait for popover to open and check for BY_LABEL option
        const labelOption = await screen.findByTitle('Go next with selected label');
        expect(labelOption).toBeInTheDocument();
    });

    it('should call setNavigationType with BY_LABEL when label icon is clicked in popover', async () => {
        const setNavigationType = jest.fn();
        const user = userEvent.setup();

        render(<PlayerButtons {...defaultProps} setNavigationType={setNavigationType} />);

        // Find and right-click the previous button popover to open it
        const popoverWrappers = screen.getAllByTestId('popover-wrapper');
        const prevPopoverWrapper = popoverWrappers[0];

        fireEvent.contextMenu(prevPopoverWrapper);

        // Wait for popover to open
        await screen.findByTitle('Go back with selected label');

        // Find and click the BY_LABEL icon
        const labelIcon = document.querySelector('.cvat-player-previous-label-inlined-button');
        await user.click(labelIcon as Element);

        expect(setNavigationType).toHaveBeenCalledWith(NavigationType.BY_LABEL);
    });

    it('should close popover after selecting navigation type', async () => {
        const setNavigationType = jest.fn();
        const user = userEvent.setup();

        render(<PlayerButtons {...defaultProps} setNavigationType={setNavigationType} />);

        // Right-click to open popover
        const popoverWrappers = screen.getAllByTestId('popover-wrapper');
        const prevPopoverWrapper = popoverWrappers[0];

        fireEvent.contextMenu(prevPopoverWrapper);

        // Wait for popover to open
        await screen.findByTitle('Go back with selected label');

        // Find and click the BY_LABEL icon
        const labelIcon = document.querySelector('.cvat-player-previous-label-inlined-button');
        await user.click(labelIcon as Element);

        // Popover should close (option should no longer be visible)
        expect(screen.queryByTitle('Go back with selected label')).not.toBeInTheDocument();
    });

    it('should display label icon when navigationType is BY_LABEL', () => {
        render(<PlayerButtons {...defaultProps} navigationType={NavigationType.BY_LABEL} />);

        // Previous button should show label icon
        const prevTooltips = screen.getAllByTestId('cvat-tooltip');
        const prevLabelTooltip = prevTooltips.find((tooltip) =>
            tooltip.getAttribute('title')?.includes('Go back with selected label'));

        expect(prevLabelTooltip).toBeInTheDocument();
    });

    it('should have correct tooltip placement for all player buttons', () => {
        render(<PlayerButtons {...defaultProps} />);

        const tooltips = screen.getAllByTestId('cvat-tooltip');

        // Main player buttons should have placement='top'
        const topTooltips = tooltips.filter((tooltip) => tooltip.getAttribute('data-placement') === 'top');

        expect(topTooltips.length).toBeGreaterThan(0);
    });

    it('should show all four navigation types in popover', async () => {
        render(<PlayerButtons {...defaultProps} />);

        // Right-click to open popover
        const popoverWrappers = screen.getAllByTestId('popover-wrapper');
        const prevPopoverWrapper = popoverWrappers[0];

        fireEvent.contextMenu(prevPopoverWrapper);

        // Check all navigation types are present
        expect(await screen.findByTitle('Go back')).toBeInTheDocument();
        expect(await screen.findByTitle('Go back with a filter')).toBeInTheDocument();
        expect(await screen.findByTitle('Go back to an empty frame')).toBeInTheDocument();
        expect(await screen.findByTitle('Go back with selected label')).toBeInTheDocument();
    });
});
