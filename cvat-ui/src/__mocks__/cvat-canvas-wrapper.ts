// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

export enum CanvasMode {
    IDLE = 0,
    DRAW = 1,
    EDIT = 2,
    MERGE = 3,
    SPLIT = 4,
    GROUP = 5,
    RESIZE = 6,
}

export enum RectDrawingMethod {
    CLASSIC = 'classic',
    EXTREME_POINTS = 'extreme_points',
}

export enum CuboidDrawingMethod {
    CLASSIC = 'classic',
}

export class Canvas {
    public mode(): CanvasMode {
        return CanvasMode.IDLE;
    }

    public isAbleToChangeFrame(): boolean {
        return true;
    }

    public destroy(): void {}
}

export default {
    Canvas,
    CanvasMode,
    RectDrawingMethod,
    CuboidDrawingMethod,
};
