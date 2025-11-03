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

export function Popover({ children, content, open, onOpenChange, trigger, ...props }: any) {
    const [isOpen, setIsOpen] = React.useState(open || false);

    React.useEffect(() => {
        if (typeof open !== 'undefined') {
            setIsOpen(open);
        }
    }, [open]);

    const handleTrigger = (e: any) => {
        if (trigger === 'contextMenu' && e.type === 'contextmenu') {
            e.preventDefault();
            const newOpenState = !isOpen;
            setIsOpen(newOpenState);
            if (onOpenChange) {
                onOpenChange(newOpenState);
            }
        }
    };

    return (
        <div data-testid='popover-wrapper' onContextMenu={handleTrigger}>
            {children}
            {isOpen && (
                <div data-testid='popover-content' {...props}>
                    {content}
                </div>
            )}
        </div>
    );
}

export default {
    Card,
    Tooltip,
    Descriptions,
    Popover,
};
