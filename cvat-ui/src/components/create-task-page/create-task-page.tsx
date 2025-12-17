// Copyright (C) 2019-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import { useLocation } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';

import CreateTaskContent, { CreateTaskData } from './create-task-content';

interface Props {
    onCreate: (data: CreateTaskData, onProgress?: (status: string) => void) => Promise<any>;
}

export default function CreateTaskPage(props: Props): JSX.Element {
    const { onCreate } = props;

    const location = useLocation();

    let projectId = null;
    const params = new URLSearchParams(location.search);
    if (params.get('projectId')?.match(/^[1-9]+[0-9]*$/)) {
        projectId = +(params.get('projectId') as string);
    }
    const many = params.get('many') === 'true';
    const manyFolders = params.get('manyFolders') === 'true';
    const handleCreate: typeof onCreate = (...onCreateParams) => onCreate(...onCreateParams);

    const getTitle = (): string => {
        if (many) return 'Create multi tasks for video files';
        if (manyFolders) return 'Create multi tasks for image folders';
        return 'Create a new task';
    };

    return (
        <Row justify='center' align='top' className='cvat-create-work-form-wrapper'>
            <Col md={20} lg={16} xl={14} xxl={9}>
                <Text className='cvat-title'>{getTitle()}</Text>
                <CreateTaskContent
                    projectId={projectId}
                    onCreate={handleCreate}
                    many={many}
                    manyFolders={manyFolders}
                />
            </Col>
        </Row>
    );
}
