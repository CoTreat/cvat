// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { BoundariesActions, BoundariesActionTypes } from 'actions/boundaries-actions';
import { ModelsActionTypes, ModelsActions } from 'actions/models-actions';
import { AuthActionTypes, AuthActions } from 'actions/auth-actions';
import { MLModel } from 'cvat-core-wrapper';
import { ModelsState } from '.';

const defaultState: ModelsState = {
    initialized: false,
    fetching: false,
    creatingStatus: '',
    interactors: [],
    detectors: [],
    trackers: [],
    reid: [],
    modelRunnerIsVisible: false,
    modelRunnerTask: null,
    inferences: {},
    totalCount: 0,
    query: {
        page: 1,
        id: null,
        search: null,
        filter: null,
        sort: null,
    },
    providers: {
        fetching: false,
        current: [],
    },
};

export default function (state = defaultState, action: ModelsActions | AuthActions | BoundariesActions): ModelsState {
    switch (action.type) {
        case ModelsActionTypes.GET_MODELS: {
            return {
                ...state,
                initialized: false,
                fetching: true,
            };
        }
        case ModelsActionTypes.GET_MODELS_SUCCESS: {
            return {
                ...state,
                interactors: action.payload.models.filter((model: MLModel) => ['interactor'].includes(model.type)),
                detectors: action.payload.models.filter((model: MLModel) => ['detector'].includes(model.type)),
                trackers: action.payload.models.filter((model: MLModel) => ['tracker'].includes(model.type)),
                reid: action.payload.models.filter((model: MLModel) => ['reid'].includes(model.type)),
                classifiers: action.payload.models.filter((model: MLModel) => ['classifier'].includes(model.type)),
                totalCount: action.payload.models.length,
                initialized: true,
                fetching: false,
            };
        }
        case ModelsActionTypes.GET_MODELS_FAILED: {
            return {
                ...state,
                initialized: true,
                fetching: false,
            };
        }
        case ModelsActionTypes.CREATE_MODEL: {
            return {
                ...state,
                fetching: true,
            };
        }
        case ModelsActionTypes.CREATE_MODEL_FAILED: {
            return {
                ...state,
                fetching: false,
            };
        }
        case ModelsActionTypes.CREATE_MODEL_SUCCESS: {
            const mutual = {
                ...state,
                fetching: false,
            };
            if (['interactor'].includes(action.payload.model.type)) {
                return {
                    ...mutual,
                    interactors: [...state.interactors, action.payload.model],
                };
            }
            if (['detector'].includes(action.payload.model.type)) {
                return {
                    ...mutual,
                    detectors: [...state.detectors, action.payload.model],
                };
            }
            if (['tracker'].includes(action.payload.model.type)) {
                return {
                    ...mutual,
                    trackers: [...state.trackers, action.payload.model],
                };
            }
            if (['reid'].includes(action.payload.model.type)) {
                return {
                    ...mutual,
                    trackers: [...state.reid, action.payload.model],
                };
            }
            return {
                ...mutual,
                interactors: [...state.interactors, action.payload.model],
            };
        }
        case ModelsActionTypes.SHOW_RUN_MODEL_DIALOG: {
            return {
                ...state,
                modelRunnerIsVisible: true,
                modelRunnerTask: action.payload.taskInstance,
            };
        }
        case ModelsActionTypes.CLOSE_RUN_MODEL_DIALOG: {
            return {
                ...state,
                modelRunnerIsVisible: false,
                modelRunnerTask: null,
            };
        }
        case ModelsActionTypes.GET_INFERENCE_STATUS_SUCCESS: {
            const { inferences } = state;

            if (action.payload.activeInference.status === 'finished') {
                return {
                    ...state,
                    inferences: Object.fromEntries(
                        Object.entries(inferences).filter(([key]): boolean => +key !== action.payload.taskID),
                    ),
                };
            }

            const update: any = {};
            update[action.payload.taskID] = action.payload.activeInference;

            return {
                ...state,
                inferences: {
                    ...state.inferences,
                    ...update,
                },
            };
        }
        case ModelsActionTypes.GET_INFERENCE_STATUS_FAILED: {
            const { inferences } = state;
            delete inferences[action.payload.taskID];

            return {
                ...state,
                inferences: { ...inferences },
            };
        }
        case ModelsActionTypes.CANCEL_INFERENCE_SUCCESS: {
            const { inferences } = state;
            delete inferences[action.payload.taskID];

            return {
                ...state,
                inferences: { ...inferences },
            };
        }
        case ModelsActionTypes.GET_MODEL_PROVIDERS: {
            return {
                ...state,
                providers: {
                    ...state.providers,
                    fetching: true,
                },
            };
        }
        case ModelsActionTypes.GET_MODEL_PROVIDERS_SUCCESS: {
            return {
                ...state,
                providers: {
                    fetching: false,
                    current: action.payload.providers,
                },
            };
        }
        case ModelsActionTypes.GET_MODEL_PROVIDERS_FAILED: {
            return {
                ...state,
                providers: {
                    ...state.providers,
                    fetching: false,
                },
            };
        }
        case BoundariesActionTypes.RESET_AFTER_ERROR:
        case AuthActionTypes.LOGOUT_SUCCESS: {
            return { ...defaultState };
        }
        default: {
            return state;
        }
    }
}
