// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

function Text({
    children, strong, style, ...props
}: any) {
    return (
        <span
            data-testid='text'
            style={{
                ...style,
                ...(strong ? { fontWeight: 'bold' } : {}),
            }}
            {...props}
        >
            {children}
        </span>
    );
}

export default Text;
