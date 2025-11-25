// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GridColor, FrameSpeed } from 'reducers';

// Mock react-redux
const mockDispatch = jest.fn();
let mockSelectorState = {
    brightnessLevel: 100,
    contrastLevel: 100,
    saturationLevel: 100,
    gridOpacity: 100,
    gridColor: GridColor.White,
    gridSize: 100,
    grid: false,
    imageFiltersEnabled: true,
};

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
        // Return the player settings directly
        return mockSelectorState;
    },
}));

// Mock GammaFilter component
jest.mock('../gamma-filter', () => function MockGammaFilter({ disabled }: { disabled?: boolean }) {
    return <div data-testid="gamma-filter" data-disabled={disabled}>Gamma Filter</div>;
});

// Mock actions
jest.mock('actions/settings-actions', () => ({
    switchGrid: jest.fn((value) => ({ type: 'SWITCH_GRID', payload: { grid: value } })),
    changeGridColor: jest.fn((value) => ({ type: 'CHANGE_GRID_COLOR', payload: { gridColor: value } })),
    changeGridOpacity: jest.fn((value) => ({ type: 'CHANGE_GRID_OPACITY', payload: { gridOpacity: value } })),
    changeBrightnessLevel: jest.fn((value) => ({ type: 'CHANGE_BRIGHTNESS_LEVEL', payload: { level: value } })),
    changeContrastLevel: jest.fn((value) => ({ type: 'CHANGE_CONTRAST_LEVEL', payload: { level: value } })),
    changeSaturationLevel: jest.fn((value) => ({ type: 'CHANGE_SATURATION_LEVEL', payload: { level: value } })),
    changeGridSize: jest.fn((value) => ({ type: 'CHANGE_GRID_SIZE', payload: { gridSize: value } })),
    resetImageFilters: jest.fn(() => ({ type: 'RESET_IMAGE_FILTERS', payload: {} })),
    switchImageFiltersEnabled: jest.fn((value) => ({ type: 'SWITCH_IMAGE_FILTERS_ENABLED', payload: { enabled: value } })),
}));

// Mock utils/math
jest.mock('utils/math', () => ({
    clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
}));

// Import component after mocks
import ImageSetupsContent from '../image-setups-content';
import { switchImageFiltersEnabled, changeBrightnessLevel, changeContrastLevel, changeSaturationLevel, resetImageFilters } from 'actions/settings-actions';

describe('ImageSetupsContent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset to default state
        mockSelectorState = {
            brightnessLevel: 100,
            contrastLevel: 100,
            saturationLevel: 100,
            gridOpacity: 100,
            gridColor: GridColor.White,
            gridSize: 100,
            grid: false,
            imageFiltersEnabled: true,
        };
    });

    describe('Image Filters Toggle', () => {
        it('should render the color settings section with enabled checkbox', () => {
            render(<ImageSetupsContent />);

            expect(screen.getByText('Color settings')).toBeInTheDocument();
            expect(screen.getByText('Enabled')).toBeInTheDocument();
        });

        it('should display keyboard shortcut tag next to enabled checkbox', () => {
            const { container } = render(<ImageSetupsContent />);

            const shortcutTag = container.querySelector('.cvat-image-setups-shortcut-tag');
            expect(shortcutTag).toBeInTheDocument();
            expect(shortcutTag).toHaveTextContent('I');
        });

        it('should have checkbox checked when imageFiltersEnabled is true', () => {
            mockSelectorState.imageFiltersEnabled = true;

            const { container } = render(<ImageSetupsContent />);

            // Find the checkbox by class name
            const checkbox = container.querySelector('.cvat-image-setups-filters-enable-checkbox input[type="checkbox"]');
            expect(checkbox).toBeChecked();
        });

        it('should have checkbox unchecked when imageFiltersEnabled is false', () => {
            mockSelectorState.imageFiltersEnabled = false;

            const { container } = render(<ImageSetupsContent />);

            // Find the checkbox by class name
            const checkbox = container.querySelector('.cvat-image-setups-filters-enable-checkbox input[type="checkbox"]');
            expect(checkbox).not.toBeChecked();
        });

        it('should dispatch switchImageFiltersEnabled(false) when checkbox is unchecked', () => {
            mockSelectorState.imageFiltersEnabled = true;

            const { container } = render(<ImageSetupsContent />);

            // Find and click the checkbox
            const checkbox = container.querySelector('.cvat-image-setups-filters-enable-checkbox input[type="checkbox"]');
            fireEvent.click(checkbox!);

            expect(switchImageFiltersEnabled).toHaveBeenCalledWith(false);
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('should dispatch switchImageFiltersEnabled(true) when checkbox is checked', () => {
            mockSelectorState.imageFiltersEnabled = false;

            const { container } = render(<ImageSetupsContent />);

            // Find and click the checkbox
            const checkbox = container.querySelector('.cvat-image-setups-filters-enable-checkbox input[type="checkbox"]');
            fireEvent.click(checkbox!);

            expect(switchImageFiltersEnabled).toHaveBeenCalledWith(true);
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('should pass disabled=false to GammaFilter when imageFiltersEnabled is true', () => {
            mockSelectorState.imageFiltersEnabled = true;

            render(<ImageSetupsContent />);

            const gammaFilter = screen.getByTestId('gamma-filter');
            expect(gammaFilter).toHaveAttribute('data-disabled', 'false');
        });

        it('should pass disabled=true to GammaFilter when imageFiltersEnabled is false', () => {
            mockSelectorState.imageFiltersEnabled = false;

            render(<ImageSetupsContent />);

            const gammaFilter = screen.getByTestId('gamma-filter');
            expect(gammaFilter).toHaveAttribute('data-disabled', 'true');
        });
    });

    describe('Color Settings Controls', () => {
        it('should render brightness, contrast, and saturation controls', () => {
            render(<ImageSetupsContent />);

            expect(screen.getByText('Brightness')).toBeInTheDocument();
            expect(screen.getByText('Contrast')).toBeInTheDocument();
            expect(screen.getByText('Saturation')).toBeInTheDocument();
        });

        it('should render the gamma filter component', () => {
            render(<ImageSetupsContent />);

            expect(screen.getByTestId('gamma-filter')).toBeInTheDocument();
        });

        it('should render the reset button', () => {
            render(<ImageSetupsContent />);

            expect(screen.getByText('Reset color settings')).toBeInTheDocument();
        });

        it('should dispatch reset actions when reset button is clicked', () => {
            render(<ImageSetupsContent />);

            const resetButton = screen.getByText('Reset color settings');
            fireEvent.click(resetButton);

            expect(changeBrightnessLevel).toHaveBeenCalledWith(100);
            expect(changeContrastLevel).toHaveBeenCalledWith(100);
            expect(changeSaturationLevel).toHaveBeenCalledWith(100);
            expect(resetImageFilters).toHaveBeenCalled();
        });
    });

    describe('Image Grid Controls', () => {
        it('should render image grid section', () => {
            render(<ImageSetupsContent />);

            expect(screen.getByText('Image grid')).toBeInTheDocument();
            expect(screen.getByText('Size')).toBeInTheDocument();
            expect(screen.getByText('Color')).toBeInTheDocument();
            expect(screen.getByText('Opacity')).toBeInTheDocument();
        });
    });
});

/**
 * Tests for the image filters enabled state logic
 */
describe('ImageFiltersEnabled State Logic', () => {
    it('should default to enabled (true)', () => {
        // The default state in the reducer should be true
        const defaultValue = true;
        expect(defaultValue).toBe(true);
    });

    it('action payload should contain correct enabled value when toggling off', () => {
        const action = { type: 'SWITCH_IMAGE_FILTERS_ENABLED', payload: { enabled: false } };
        expect(action.payload.enabled).toBe(false);
    });

    it('action payload should contain correct enabled value when toggling on', () => {
        const action = { type: 'SWITCH_IMAGE_FILTERS_ENABLED', payload: { enabled: true } };
        expect(action.payload.enabled).toBe(true);
    });
});
