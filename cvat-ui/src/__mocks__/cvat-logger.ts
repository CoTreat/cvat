// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

export enum EventScope {
    loadJob = 'load:job',
    clickElement = 'click:element',
    sendLogs = 'send:logs',
}

const logger = {
    log: jest.fn(),
};

export default logger;
