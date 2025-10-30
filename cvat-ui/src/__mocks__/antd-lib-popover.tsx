// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

export default function Popover({ children, content, open, onOpenChange, trigger, overlayInnerStyle, placement, ...props }: any) {
    const handleTrigger = (e: any) => {
        if (trigger === 'contextMenu' && e.type === 'contextmenu') {
            e.preventDefault();
            if (onOpenChange) {
                onOpenChange(!open);
            }
        }
    };

    const isOpen = typeof open !== 'undefined' ? open : false;

    return (
        <div data-testid='popover-wrapper' onContextMenu={handleTrigger}>
            {children}
            {isOpen && (
                <div data-testid='popover-content' style={overlayInnerStyle} data-placement={placement} {...props}>
                    {content}
                </div>
            )}
        </div>
    );
}
