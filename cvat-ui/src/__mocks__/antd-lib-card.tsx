// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

function Card({
    children, cover, hoverable, ...props
}: any) {
    return (
        <div
            data-testid='card'
            data-hoverable={hoverable}
            {...props}
        >
            {cover && <div data-testid='card-cover'>{cover}</div>}
            {children}
        </div>
    );
}

export default Card;
