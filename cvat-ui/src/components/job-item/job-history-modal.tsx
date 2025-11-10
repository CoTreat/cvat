// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import Modal from 'antd/lib/modal';
import Table, { ColumnsType } from 'antd/lib/table';
import Spin from 'antd/lib/spin';
import notification from 'antd/lib/notification';
import Text from 'antd/lib/typography/Text';
import moment from 'moment';

import { getCore } from 'cvat-core-wrapper';

const cvat = getCore();

type HistoryValue = string | number | boolean | null | Record<string, unknown>;

interface JobHistoryRecord {
    timestamp: string;
    user_id: number | null;
    user_name: string | null;
    field_name: string;
    old_value: HistoryValue;
    new_value: HistoryValue;
}

interface Props {
    jobId: number;
    visible: boolean;
    onClose: () => void;
}

function JobHistoryModal(props: Props): JSX.Element {
    const { jobId, visible, onClose } = props;
    const [loading, setLoading] = useState(false);
    const [historyData, setHistoryData] = useState<JobHistoryRecord[]>([]);

    useEffect(() => {
        if (visible && jobId) {
            setLoading(true);
            cvat.analytics.events.getJobHistory(jobId)
                .then((data: JobHistoryRecord[]) => {
                    setHistoryData(data);
                })
                .catch((error: Error) => {
                    notification.error({
                        message: 'Failed to load job history',
                        description: error.message || 'An error occurred',
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [visible, jobId]);

    const getFieldLabel = (fieldName: string): string => {
        const labels: Record<string, string> = {
            assignee: 'Assignee',
            stage: 'Stage',
            state: 'State',
        };
        return labels[fieldName] || fieldName;
    };

    const formatValue = (fieldName: string, value: HistoryValue): string => {
        if (value === null || value === undefined) {
            return 'None';
        }

        // For assignee field, extract username from object or JSON string
        if (fieldName === 'assignee') {
            let assigneeObj: Record<string, unknown> | null = null;

            if (typeof value === 'object') {
                assigneeObj = value as Record<string, unknown>;
            } else if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (typeof parsed === 'object' && parsed !== null) {
                        assigneeObj = parsed as Record<string, unknown>;
                    }
                } catch {
                    // Not a JSON string, return as-is
                    return value;
                }
            } else {
                return String(value);
            }

            if (assigneeObj && typeof assigneeObj.username === 'string') {
                return assigneeObj.username;
            }

            return String(value);
        }

        // For other fields, use simple formatting
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }

        if (typeof value === 'number') {
            return `${value}`;
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (error) {
                return 'Unsupported value';
            }
        }

        return String(value);
    };

    const columns: ColumnsType<JobHistoryRecord> = [
        {
            title: 'Date & Time',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (timestamp: string) => (
                <Text>{moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
            ),
        },
        {
            title: 'Changed By',
            dataIndex: 'user_name',
            key: 'user_name',
            width: 150,
            render: (userName: string | null) => (
                <Text>{userName || 'Unknown'}</Text>
            ),
        },
        {
            title: 'Field',
            dataIndex: 'field_name',
            key: 'field_name',
            width: 120,
            render: (fieldName: string) => (
                <Text strong>{getFieldLabel(fieldName)}</Text>
            ),
        },
        {
            title: 'Old Value',
            dataIndex: 'old_value',
            key: 'old_value',
            render: (oldValue: HistoryValue, record: JobHistoryRecord) => (
                <Text>{formatValue(record.field_name, oldValue)}</Text>
            ),
        },
        {
            title: 'New Value',
            dataIndex: 'new_value',
            key: 'new_value',
            render: (newValue: HistoryValue, record: JobHistoryRecord) => (
                <Text>{formatValue(record.field_name, newValue)}</Text>
            ),
        },
    ];

    return (
        <Modal
            title={`Job #${jobId} - Change History`}
            open={visible}
            onCancel={onClose}
            onOk={onClose}
            width={900}
            cancelButtonProps={{ style: { display: 'none' } }}
            okText='Close'
        >
            <Spin spinning={loading}>
                {historyData.length === 0 && !loading ? (
                    <Text type='secondary'>No status changes recorded for this job.</Text>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={historyData}
                        rowKey={(record) => `${record.timestamp}-${record.field_name}`}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total) => `Total ${total} changes`,
                        }}
                        size='small'
                        bordered
                        scroll={{ y: 400 }}
                    />
                )}
            </Spin>
        </Modal>
    );
}

export default React.memo(JobHistoryModal);
