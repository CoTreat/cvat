// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

// Mock Ant Design components
export function Card({ children, ...props }: any) {
    return <div data-testid='card' {...props}>{children}</div>;
}
export function Tooltip({ children, title }: any) {
    return (
        <div data-testid='tooltip'>
            <div data-testid='tooltip-content'>{title}</div>
            {children}
        </div>
    );
}
export function Descriptions({ children }: any) {
    return <div data-testid='descriptions'>{children}</div>;
}
Descriptions.Item = function ({ label, children }: any) {
    return (
        <div data-testid='description-item'>
            <span data-testid='description-label'>{label}</span>
            <span data-testid='description-value'>{children}</span>
        </div>
    );
};

export default {
    Card,
    Tooltip,
    Descriptions,
};
