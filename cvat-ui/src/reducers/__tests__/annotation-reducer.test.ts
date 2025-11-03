// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import annotationReducer from '../annotation-reducer';
import { AnnotationActionTypes } from '../../actions/annotation-actions';
import { NavigationType } from '../index';

describe('Annotation Reducer - BY_LABEL Navigation', () => {
    const initialState = {
        activities: {
            loads: {},
        },
        canvas: {
            contextMenu: {
                visible: false,
                top: 0,
                left: 0,
                type: null,
                pointID: null,
            },
            instance: null,
            ready: false,
            activeControl: null,
        },
        job: {
            openTime: null,
            instance: null,
            labels: [],
            frameData: null,
            colors: [],
            filters: [],
            requestedId: null,
        },
        player: {
            frame: {
                number: 0,
                filename: '',
                data: null,
                fetching: false,
                delay: 0,
                changeTime: null,
                changeFrameEvent: null,
            },
            navigationType: NavigationType.REGULAR,
            selectedLabelName: null,
            ranges: '',
            playing: false,
            frameAngles: [],
            navigationBlocked: false,
        },
        drawing: {
            activeInteractor: undefined,
            activeInitialState: null,
            activeNumOfPoints: null,
            activeObjectType: null,
            activeRectDrawingMethod: null,
            activeLabelID: null,
            activeShapeType: null,
        },
        annotations: {
            activatedStateID: null,
            activatedElementID: null,
            activatedAttributeID: null,
            highlightedConflict: null,
            collapsed: {},
            collapsedAll: true,
            states: [],
            filters: [],
            resetGroupFlag: false,
            history: {
                undo: [],
                redo: [],
            },
            saving: {
                forceExit: false,
                uploading: false,
            },
            zLayer: {
                min: 0,
                max: 0,
                cur: 0,
            },
        },
        propagate: {
            objectState: null,
            frames: 50,
        },
        statistics: {
            visible: false,
            collecting: false,
            data: null,
        },
        colors: [],
        filtersPanelVisible: false,
        sidebarCollapsed: false,
        appearanceCollapsed: false,
        tabContentHeight: 0,
        workspace: null,
        aiToolsRef: null,
        showAllInterpolationTracks: false,
    };

    it('should handle SET_LABEL_FILTER with label name', () => {
        const action = {
            type: AnnotationActionTypes.SET_LABEL_FILTER,
            payload: {
                labelName: 'Person',
            },
        };

        const newState = annotationReducer(initialState as any, action);

        expect(newState.player.selectedLabelName).toBe('Person');
        expect(newState.player.navigationType).toBe(NavigationType.REGULAR); // navigationType shouldn't change
    });

    it('should handle SET_LABEL_FILTER with null', () => {
        const stateWithLabel = {
            ...initialState,
            player: {
                ...initialState.player,
                selectedLabelName: 'Car',
            },
        };

        const action = {
            type: AnnotationActionTypes.SET_LABEL_FILTER,
            payload: {
                labelName: null,
            },
        };

        const newState = annotationReducer(stateWithLabel as any, action);

        expect(newState.player.selectedLabelName).toBe(null);
    });

    it('should update selectedLabelName when switching labels', () => {
        const stateWithLabel = {
            ...initialState,
            player: {
                ...initialState.player,
                selectedLabelName: 'Person',
                navigationType: NavigationType.BY_LABEL,
            },
        };

        const action = {
            type: AnnotationActionTypes.SET_LABEL_FILTER,
            payload: {
                labelName: 'Car',
            },
        };

        const newState = annotationReducer(stateWithLabel as any, action);

        expect(newState.player.selectedLabelName).toBe('Car');
        expect(newState.player.navigationType).toBe(NavigationType.BY_LABEL);
    });

    it('should not affect other player state when setting label filter', () => {
        const stateWithCustomPlayer = {
            ...initialState,
            player: {
                ...initialState.player,
                frame: {
                    ...initialState.player.frame,
                    number: 42,
                },
                playing: true,
                ranges: '1-100',
            },
        };

        const action = {
            type: AnnotationActionTypes.SET_LABEL_FILTER,
            payload: {
                labelName: 'Bicycle',
            },
        };

        const newState = annotationReducer(stateWithCustomPlayer as any, action);

        expect(newState.player.selectedLabelName).toBe('Bicycle');
        expect(newState.player.frame.number).toBe(42);
        expect(newState.player.playing).toBe(true);
        expect(newState.player.ranges).toBe('1-100');
    });
});
