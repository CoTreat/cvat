// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Breadcrumb } from 'antd';
import CVATTooltip from 'components/common/cvat-tooltip';
import {
    BookOutlined, BorderlessTableOutlined, CarryOutOutlined, UserOutlined,
} from '@ant-design/icons';

interface JobBreadcrumbProps {
    job: any;
}

function JobBreadcrumb({ job }: JobBreadcrumbProps): JSX.Element | null {
    if (!job) {
        return null;
    }

    return (
        <Breadcrumb className='cvat-annotation-breadcrumb'>
            {job?.projectName && (
                <Breadcrumb.Item>

                    <CVATTooltip title='Project'>
                        <BookOutlined />
                        {' '}

                        {job.projectName}
                    </CVATTooltip>
                </Breadcrumb.Item>
            )}
            <Breadcrumb.Item>
                <CVATTooltip title='Task'>
                    <CarryOutOutlined />
                    {' '}
                    {job?.taskName ? job.taskName : '--'}
                </CVATTooltip>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <CVATTooltip title='Job ID'>
                    <BorderlessTableOutlined />
                    {' '}
                    {job?.id}
                </CVATTooltip>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <CVATTooltip title='Assignee'>
                    <UserOutlined />
                    {' '}
                    {job.assignee?.username ? job.assignee.username : '--'}
                </CVATTooltip>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <CVATTooltip title='Stage'>
                    {job.stage}
                </CVATTooltip>
            </Breadcrumb.Item>
        </Breadcrumb>
    );
}

export default JobBreadcrumb;
