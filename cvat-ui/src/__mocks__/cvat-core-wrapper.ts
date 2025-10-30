// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

export enum JobType {
    ANNOTATION = 'annotation',
    GROUND_TRUTH = 'ground_truth',
}

export enum JobStage {
    ANNOTATION = 'annotation',
    VALIDATION = 'validation',
    ACCEPTANCE = 'acceptance',
}

export enum JobState {
    NEW = 'new',
    IN_PROGRESS = 'in progress',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}

export enum ObjectType {
    SHAPE = 'shape',
    TRACK = 'track',
    TAG = 'tag',
}

export enum ShapeType {
    RECTANGLE = 'rectangle',
    POLYGON = 'polygon',
    POLYLINE = 'polyline',
    POINTS = 'points',
    ELLIPSE = 'ellipse',
    CUBOID = 'cuboid',
    SKELETON = 'skeleton',
    MASK = 'mask',
}

export enum DimensionType {
    DIMENSION_2D = '2d',
    DIMENSION_3D = '3d',
}

export enum LabelType {
    TAG = 'tag',
    ANY = 'any',
    RECTANGLE = 'rectangle',
    POLYGON = 'polygon',
    POLYLINE = 'polyline',
    POINTS = 'points',
    ELLIPSE = 'ellipse',
    CUBOID = 'cuboid',
    SKELETON = 'skeleton',
    MASK = 'mask',
}

export class Label {
    public id: number;
    public name: string;
    public type: LabelType;
    public attributes: any[];

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.attributes = data.attributes || [];
    }
}

export class Job {
    public id: number;
    public taskId: number;
    public taskName: string;
    public projectId: number | null;
    public projectName: string | null;
    public stage: JobStage;
    public state: JobState;
    public startFrame: number;
    public stopFrame: number;
    public assignee: { username: string } | null;
    public type: JobType;
    public dimension: string;
    public consensusReplicas: number;
    public labels: Label[];
    public mode: string;

    constructor(data: any) {
        this.id = data.id;
        this.taskId = data.taskId;
        this.taskName = data.taskName;
        this.projectId = data.projectId;
        this.projectName = data.projectName;
        this.stage = data.stage;
        this.state = data.state;
        this.startFrame = data.startFrame;
        this.stopFrame = data.stopFrame;
        this.assignee = data.assignee;
        this.type = data.type;
        this.dimension = data.dimension || '2d';
        this.consensusReplicas = data.consensusReplicas || 0;
        this.labels = data.labels || [];
        this.mode = data.mode || 'annotation';
    }
}

export class ObjectState {}
export class MLModel {}
export class QualityConflict {}
export class JobValidationLayout {}

export const getCore = jest.fn(() => ({
    // Add any methods that might be called on the cvat core object
    config: {},
    server: {},
    lambda: {},
    classes: {
        Job,
        Label,
    },
}));

export default {
    Job,
    JobType,
    JobStage,
    JobState,
    ObjectType,
    ShapeType,
    DimensionType,
    LabelType,
    Label,
    ObjectState,
    MLModel,
    QualityConflict,
    JobValidationLayout,
    getCore,
};
