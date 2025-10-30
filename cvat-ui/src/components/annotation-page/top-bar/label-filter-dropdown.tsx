// Copyright (C) 2024
// SPDX-License-Identifier: MIT

import React from 'react';
import Select from 'antd/lib/select';
import { FilterOutlined } from '@ant-design/icons';
import { Label } from 'cvat-core-wrapper';
import CVATTooltip from 'components/common/cvat-tooltip';

const { Option } = Select;

interface Props {
    labels: Label[];
    selectedLabelName: string | null;
    onSelectLabel(labelName: string | null): void;
    navigationType: string;
}

function LabelFilterDropdown(props: Props): JSX.Element {
    const {
        labels, selectedLabelName, onSelectLabel, navigationType,
    } = props;

    // Hide dropdown if not in BY_LABEL navigation mode
    if (navigationType !== 'by_label') {
        // @ts-ignore
        return null;
    }

    // Use first label if nothing is selected yet
    const displayValue = selectedLabelName ?? (labels.length > 0 ? labels[0].name : undefined);

    return (
        <CVATTooltip title='Filter frames by label'>
            <Select
                className='cvat-label-filter-dropdown'
                placeholder={<FilterOutlined />}
                value={displayValue}
                onChange={onSelectLabel}
                allowClear={false}
                size='small'
                style={{ minWidth: 80, margin: '0 16px 0 8px' }}
                // dropdownMatchSelectWidth={false}
                popupMatchSelectWidth={false}
            >
                {labels.map((label) => (
                    <Option key={label.id} value={label.name}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: label.color,
                                    marginRight: 8,
                                    borderRadius: 2,
                                }}
                            />
                            {label.name}
                        </div>
                    </Option>
                ))}
            </Select>
        </CVATTooltip>
    );
}

export default React.memo(LabelFilterDropdown);
