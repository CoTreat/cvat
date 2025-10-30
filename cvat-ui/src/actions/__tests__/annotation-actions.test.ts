// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import { setLabelFilter, AnnotationActionTypes } from '../annotation-actions';

describe('Annotation Actions - BY_LABEL Navigation', () => {
    describe('setLabelFilter', () => {
        it('should create SET_LABEL_FILTER action with label name', () => {
            const labelName = 'Person';
            const expectedAction = {
                type: AnnotationActionTypes.SET_LABEL_FILTER,
                payload: {
                    labelName: 'Person',
                },
            };

            expect(setLabelFilter(labelName)).toEqual(expectedAction);
        });

        it('should create SET_LABEL_FILTER action with null', () => {
            const expectedAction = {
                type: AnnotationActionTypes.SET_LABEL_FILTER,
                payload: {
                    labelName: null,
                },
            };

            expect(setLabelFilter(null)).toEqual(expectedAction);
        });

        it('should handle different label names', () => {
            const testCases = ['Car', 'Bicycle', 'Person', 'Traffic Light'];

            testCases.forEach((labelName) => {
                const action = setLabelFilter(labelName);
                expect(action.type).toBe(AnnotationActionTypes.SET_LABEL_FILTER);
                expect(action.payload.labelName).toBe(labelName);
            });
        });
    });
});
