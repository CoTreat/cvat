// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

function Descriptions({ children }: any) {
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

export default Descriptions;
