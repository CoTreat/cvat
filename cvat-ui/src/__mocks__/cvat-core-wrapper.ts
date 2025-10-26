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
    }
}

export default {
    Job,
    JobType,
    JobStage,
    JobState,
};
