// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import { Breadcrumb } from 'antd';
import CVATTooltip from 'components/common/cvat-tooltip';
import {
    BookOutlined, BorderlessTableOutlined, CarryOutOutlined, UserOutlined, HistoryOutlined,
} from '@ant-design/icons';
import JobHistoryModal from 'components/job-item/job-history-modal';

interface JobBreadcrumbProps {
    job: any;
}

function JobBreadcrumb({ job }: JobBreadcrumbProps): JSX.Element | null {
    const [historyModalVisible, setHistoryModalVisible] = useState(false);

    if (!job) {
        return null;
    }

    return (
        <>
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
                    {' '}
                    <CVATTooltip title='View change history'>
                        <HistoryOutlined
                            onClick={() => setHistoryModalVisible(true)}
                            className='cvat-job-breadcrumb-history-button'
                        />
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
            <JobHistoryModal
                jobId={job.id}
                visible={historyModalVisible}
                onClose={() => setHistoryModalVisible(false)}
            />
        </>
    );
}

export default JobBreadcrumb;
