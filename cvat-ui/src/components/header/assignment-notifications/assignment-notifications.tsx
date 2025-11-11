// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router';
import { BellOutlined } from '@ant-design/icons';
import Badge from 'antd/lib/badge';
import Button from 'antd/lib/button';
import Popover from 'antd/lib/popover';
import notification from 'antd/lib/notification';
import Spin from 'antd/lib/spin';
import Empty from 'antd/lib/empty';
import { getCore } from 'cvat-core-wrapper';

interface AssignmentNotification {
    timestamp: string;
    scope: string;
    assignee_id: number;
    assignee_username: string;
    project_id: number | null;
    task_id: number | null;
    job_id: number | null;
}

const LAST_OPENED_KEY = 'assignment_notifications_last_opened';
const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

function AssignmentNotifications(): JSX.Element {
    const core = getCore();
    const history = useHistory();
    const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const [badgeCount, setBadgeCount] = useState<number>(0);

    const getLastOpenedTimestamp = (): number => {
        const stored = localStorage.getItem(LAST_OPENED_KEY);
        return stored ? parseInt(stored, 10) : 0;
    };

    const setLastOpenedTimestamp = (timestamp: number): void => {
        localStorage.setItem(LAST_OPENED_KEY, timestamp.toString());
    };

    const handleNotificationClick = (notif: AssignmentNotification): void => {
        setVisible(false);

        if (notif.scope === 'update:job' && notif.job_id) {
            history.push(`/tasks/${notif.task_id}/jobs/${notif.job_id}`);
        } else if (notif.scope === 'update:task' && notif.task_id) {
            history.push(`/tasks/${notif.task_id}`);
        } else if (notif.scope === 'update:project' && notif.project_id) {
            history.push(`/projects/${notif.project_id}`);
        }
    };

    const fetchNotifications = useCallback(async (showAutoNotification = false): Promise<void> => {
        try {
            setLoading(true);
            const data = await core.analytics.events.getAssignmentNotifications(20);
            setNotifications(data);

            // Calculate badge count based on last opened timestamp
            const lastOpened = getLastOpenedTimestamp();
            const newNotifications = data.filter((notif: AssignmentNotification) => {
                const notifTimestamp = new Date(notif.timestamp).getTime();
                return notifTimestamp > lastOpened;
            });
            setBadgeCount(newNotifications.length);

            // Show auto-notification for very recent items (within last 2 minutes)
            if (showAutoNotification) {
                const twoMinutesAgo = Date.now() - POLL_INTERVAL;
                const veryRecentNotifications = data.filter((notif: AssignmentNotification) => {
                    const notifTimestamp = new Date(notif.timestamp).getTime();
                    return notifTimestamp > twoMinutesAgo;
                });

                veryRecentNotifications.forEach((notif: AssignmentNotification) => {
                    const dateTime = new Date(notif.timestamp).toLocaleString();
                    let resourceMessage = '';

                    if (notif.scope === 'update:job' && notif.job_id) {
                        resourceMessage = `Job #${notif.job_id} was assigned to you.`;
                    } else if (notif.scope === 'update:task' && notif.task_id) {
                        resourceMessage = `Task #${notif.task_id} was assigned to you.`;
                    } else if (notif.scope === 'update:project' && notif.project_id) {
                        resourceMessage = `Project #${notif.project_id} was assigned to you.`;
                    } else {
                        resourceMessage = 'Assignment notification';
                    }

                    notification.info({
                        message: 'New Assignment',
                        description: (
                            <div>
                                <div>{resourceMessage}</div>
                                <div>{dateTime}</div>
                            </div>
                        ),
                        placement: 'topRight',
                        duration: 10,
                        onClick: () => {
                            handleNotificationClick(notif);
                        },
                    });
                });
            }
        } catch (error) {
            console.error('Failed to fetch assignment notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [core.analytics.events]);

    useEffect(() => {
        // Initial fetch
        fetchNotifications(false);

        // Setup polling
        const intervalId = setInterval(() => {
            fetchNotifications(true);
        }, POLL_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [fetchNotifications]);

    const getNotificationMessage = (notif: AssignmentNotification): string => {
        const dateTime = new Date(notif.timestamp).toLocaleString();

        if (notif.scope === 'update:job' && notif.job_id) {
            return `Job #${notif.job_id} was assigned to you - ${dateTime}`;
        } if (notif.scope === 'update:task' && notif.task_id) {
            return `Task #${notif.task_id} was assigned to you - ${dateTime}`;
        } if (notif.scope === 'update:project' && notif.project_id) {
            return `Project #${notif.project_id} was assigned to you - ${dateTime}`;
        }
        return `Assignment notification - ${dateTime}`;
    };

    const handleVisibleChange = (newVisible: boolean): void => {
        setVisible(newVisible);

        if (!newVisible) {
            // Mark as read when popover is dismissed/closed
            setLastOpenedTimestamp(Date.now());
            setBadgeCount(0);
        }
    };

    let notificationsContent = null;

    if (loading && notifications.length === 0) {
        notificationsContent = (
            <div className='cvat-assignment-notifications-loading'>
                <Spin />
            </div>
        );
    } else if (notifications.length === 0) {
        notificationsContent = (
            <Empty
                description='No assignment notifications'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    } else {
        notificationsContent = (
            <div className='cvat-assignment-notifications-list'>
                {notifications.map((notif: AssignmentNotification, index: number) => {
                    const notifTimestamp = new Date(notif.timestamp).getTime();
                    const twoMinutesAgo = Date.now() - POLL_INTERVAL;
                    const isNew = notifTimestamp > twoMinutesAgo;

                    return (
                        <div
                            key={index}
                            className='cvat-assignment-notification-item'
                            role='button'
                            tabIndex={0}
                            onClick={() => handleNotificationClick(notif)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleNotificationClick(notif);
                                }
                            }}
                        >
                            <div className={`cvat-assignment-notification-message ${isNew ? 'cvat-assignment-notification-new' : ''}`}>
                                {getNotificationMessage(notif)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    const content = (
        <div className='cvat-assignment-notifications-popover'>
            {notificationsContent}
        </div>
    );

    return (
        <Popover
            content={content}
            title='Assignment Notifications'
            trigger='click'
            open={visible}
            onOpenChange={handleVisibleChange}
            placement='bottomRight'
            overlayClassName='cvat-assignment-notifications-overlay'
        >
            <Badge count={badgeCount} offset={[-15, 10]} size='small'>
                <Button
                    type='link'
                    icon={<BellOutlined />}
                    size='large'
                    className='cvat-assignment-notifications-button cvat-header-button'
                />
            </Badge>
        </Popover>
    );
}

export default React.memo(AssignmentNotifications);
