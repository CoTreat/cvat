// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';

import React, {
    useState, useEffect, useRef, useCallback,
} from 'react';
import { useHistory } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Button from 'antd/lib/button';
import { EditOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';

import { AnnotationGuide, Project, Task } from 'cvat-core-wrapper';

interface Props {
    instanceType: 'task' | 'project';
    id: number;
    instance: Project | Task;
}

function MdGuideControl(props: Props): JSX.Element {
    const { instanceType, id, instance } = props;
    const history = useHistory();
    const [description, setDescription] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        instance.guide()
            .then((existingGuide: AnnotationGuide | null) => {
                if (existingGuide) {
                    setDescription(existingGuide.markdown);
                }
            }).catch((error: unknown) => {
                // eslint-disable-next-line no-console
                console.error('Failed to fetch guide:', error);
            });
    }, [instance]);

    const checkOverflow = useCallback(() => {
        if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current;
            setIsOverflowing(scrollHeight > clientHeight);
        }
    }, []);

    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [description, checkOverflow]);

    const title = `${instanceType[0].toUpperCase()}${instanceType.slice(1)} description`;

    return (
        <Row justify='start' className='cvat-md-guide-control-wrapper'>
            <Col span={24}>
                <div className='cvat-md-guide-header'>
                    <Text strong className='cvat-text-color'>{title}</Text>
                    <EditOutlined
                        className='cvat-md-guide-edit-icon'
                        onClick={() => {
                            history.push(`/${instanceType}s/${id}/guide`);
                        }}
                    />
                </div>
                {description ? (
                    <div className='cvat-md-guide-content-wrapper'>
                        <div
                            ref={contentRef}
                            className={`cvat-md-guide-content ${expanded ? 'cvat-md-guide-content-expanded' : 'cvat-md-guide-content-collapsed'}`}
                            data-color-mode='light'
                        >
                            <MDEditor.Markdown source={description} />
                        </div>
                        {!expanded && isOverflowing && <div className='cvat-md-guide-content-fade' />}
                        {isOverflowing && (
                            <Button
                                type='link'
                                className='cvat-md-guide-expand-button'
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className='cvat-md-guide-content-wrapper'>
                        <Text type='secondary'>No description available</Text>
                    </div>
                )}
            </Col>
        </Row>
    );
}

export default React.memo(MdGuideControl);
