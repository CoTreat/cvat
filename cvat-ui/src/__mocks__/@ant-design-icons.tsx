// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

export function CarryOutOutlined() {
    return <span data-testid='carry-out-icon'>CarryOutIcon</span>;
}
export function MoreOutlined(props: any) {
    return <span data-testid='more-icon' {...props}>MoreIcon</span>;
}

// Mock the Icon component
export default function Icon({ component: Component, className, onClick, style, ...props }: any) {
    if (Component) {
        return (
            <span className={className} onClick={onClick} style={style} data-testid='icon'>
                <Component {...props} />
            </span>
        );
    }
    return <span className={className} onClick={onClick} style={style} {...props} />;
}

Icon.displayName = 'Icon';
