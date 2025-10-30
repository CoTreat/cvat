// Copyright (C) 2020-2024 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { CSSProperties } from 'react';
import { Col } from 'antd/lib/grid';
import Icon from '@ant-design/icons';
import Popover from 'antd/lib/popover';

import CVATTooltip from 'components/common/cvat-tooltip';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { NavigationType, Workspace } from 'reducers';
import {
    FirstIcon,
    BackJumpIcon,
    PreviousIcon,
    PreviousFilteredIcon,
    PreviousEmptyIcon,
    PreviousLabelIcon,
    PlayIcon,
    PauseIcon,
    NextIcon,
    NextFilteredIcon,
    NextEmptyIcon,
    NextLabelIcon,
    ForwardJumpIcon,
    LastIcon,
} from 'icons';
import { ShortcutScope } from 'utils/enums';
import { registerComponentShortcuts } from 'actions/shortcuts-actions';
import { subKeyMap } from 'utils/component-subkeymap';

interface Props {
    playing: boolean;
    playPauseShortcut: string;
    nextFrameShortcut: string;
    previousFrameShortcut: string;
    forwardShortcut: string;
    backwardShortcut: string;
    keyMap: KeyMap;
    workspace: Workspace;
    navigationType: NavigationType;
    onSwitchPlay(): void;
    onPrevFrame(): void;
    onNextFrame(): void;
    onForward(): void;
    onBackward(): void;
    onFirstFrame(): void;
    onLastFrame(): void;
    onSearchAnnotations(direction: 'forward' | 'backward'): void;
    setNavigationType(navigationType: NavigationType): void;
}

const componentShortcuts = {
    NEXT_FRAME: {
        name: 'Next frame',
        description: 'Go to the next frame',
        sequences: ['f'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    PREV_FRAME: {
        name: 'Previous frame',
        description: 'Go to the previous frame',
        sequences: ['d'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    FORWARD_FRAME: {
        name: 'Forward frame',
        description: 'Go forward with a step',
        sequences: ['v'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    BACKWARD_FRAME: {
        name: 'Backward frame',
        description: 'Go backward with a step',
        sequences: ['c'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    SEARCH_FORWARD: {
        name: 'Search forward',
        description: 'Search the next frame that satisfies to the filters',
        sequences: ['right'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    SEARCH_BACKWARD: {
        name: 'Search backward',
        description: 'Search the previous frame that satisfies to the filters',
        sequences: ['left'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    PLAY_PAUSE: {
        name: 'Play/pause',
        description: 'Start/stop automatic changing frames',
        sequences: ['space'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
};

registerComponentShortcuts(componentShortcuts);

function PlayerButtons(props: Props): JSX.Element {
    const {
        playing,
        playPauseShortcut,
        nextFrameShortcut,
        previousFrameShortcut,
        forwardShortcut,
        backwardShortcut,
        keyMap,
        navigationType,
        workspace,
        onSwitchPlay,
        onPrevFrame,
        onNextFrame,
        onForward,
        onBackward,
        onFirstFrame,
        onLastFrame,
        setNavigationType,
        onSearchAnnotations,
    } = props;

    const [prevPopoverVisible, setPrevPopoverVisible] = React.useState(false);
    const [nextPopoverVisible, setNextPopoverVisible] = React.useState(false);

    const handleSetNavigationType = (navType: NavigationType, popoverSetter: (visible: boolean) => void): void => {
        setNavigationType(navType);
        popoverSetter(false);
    };

    const handlers: Partial<Record<keyof typeof componentShortcuts, ((event?: KeyboardEvent) => void)>> = {
        NEXT_FRAME: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            onNextFrame();
        },
        PREV_FRAME: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            onPrevFrame();
        },
        ...(workspace !== Workspace.SINGLE_SHAPE ? {
            FORWARD_FRAME: (event: KeyboardEvent | undefined) => {
                event?.preventDefault();
                onForward();
            },
            BACKWARD_FRAME: (event: KeyboardEvent | undefined) => {
                event?.preventDefault();
                onBackward();
            },
            SEARCH_FORWARD: (event: KeyboardEvent | undefined) => {
                event?.preventDefault();
                onSearchAnnotations('forward');
            },
            SEARCH_BACKWARD: (event: KeyboardEvent | undefined) => {
                event?.preventDefault();
                onSearchAnnotations('backward');
            },
            PLAY_PAUSE: (event: KeyboardEvent | undefined) => {
                event?.preventDefault();
                onSwitchPlay();
            },
        } : {}),
    };

    const prevRegularText = 'Go back';
    const prevFilteredText = 'Go back with a filter';
    const prevEmptyText = 'Go back to an empty frame';
    const prevLabelText = 'Go back with selected label';
    const nextRegularText = 'Go next';
    const nextFilteredText = 'Go next with a filter';
    const nextEmptyText = 'Go next to an empty frame';
    const nextLabelText = 'Go next with selected label';

    let prevButton = <Icon className='cvat-player-previous-button' component={PreviousIcon} onClick={onPrevFrame} />;
    let prevButtonTooltipMessage = prevRegularText;
    if (navigationType === NavigationType.FILTERED) {
        prevButton = (
            <Icon
                className='cvat-player-previous-button-filtered'
                component={PreviousFilteredIcon}
                onClick={onPrevFrame}
            />
        );
        prevButtonTooltipMessage = prevFilteredText;
    } else if (navigationType === NavigationType.EMPTY) {
        prevButton = (
            <Icon className='cvat-player-previous-button-empty' component={PreviousEmptyIcon} onClick={onPrevFrame} />
        );
        prevButtonTooltipMessage = prevEmptyText;
    } else if (navigationType === NavigationType.BY_LABEL) {
        prevButton = (
            <Icon className='cvat-player-previous-button-label' component={PreviousLabelIcon} onClick={onPrevFrame} />
        );
        prevButtonTooltipMessage = prevLabelText;
    }

    let nextButton = <Icon className='cvat-player-next-button' component={NextIcon} onClick={onNextFrame} />;
    let nextButtonTooltipMessage = nextRegularText;
    if (navigationType === NavigationType.FILTERED) {
        nextButton = (
            <Icon className='cvat-player-next-button-filtered' component={NextFilteredIcon} onClick={onNextFrame} />
        );
        nextButtonTooltipMessage = nextFilteredText;
    } else if (navigationType === NavigationType.EMPTY) {
        nextButton = <Icon className='cvat-player-next-button-empty' component={NextEmptyIcon} onClick={onNextFrame} />;
        nextButtonTooltipMessage = nextEmptyText;
    } else if (navigationType === NavigationType.BY_LABEL) {
        nextButton = <Icon className='cvat-player-next-button-label' component={NextLabelIcon} onClick={onNextFrame} />;
        nextButtonTooltipMessage = nextLabelText;
    }

    const navIconStyle: CSSProperties = workspace === Workspace.SINGLE_SHAPE ? {
        pointerEvents: 'none',
        opacity: 0.5,
    } : {};

    return (
        <Col className='cvat-player-buttons'>
            <GlobalHotKeys keyMap={subKeyMap(componentShortcuts, keyMap)} handlers={handlers} />
            <CVATTooltip placement='top' title='Go to the first frame'>
                <Icon
                    style={navIconStyle}
                    className='cvat-player-first-button'
                    component={FirstIcon}
                    onClick={onFirstFrame}
                />
            </CVATTooltip>
            <CVATTooltip placement='top' title={`Go back with a step ${backwardShortcut}`}>
                <Icon
                    style={navIconStyle}
                    className='cvat-player-backward-button'
                    component={BackJumpIcon}
                    onClick={onBackward}
                />
            </CVATTooltip>
            <Popover
                trigger='contextMenu'
                placement='bottom'
                overlayInnerStyle={{ padding: '8px 16px' }}
                open={prevPopoverVisible}
                onOpenChange={setPrevPopoverVisible}
                content={(
                    <>
                        <CVATTooltip placement='bottom' title={`${prevRegularText}`}>
                            <Icon
                                className='cvat-player-previous-inlined-button'
                                component={PreviousIcon}
                                onClick={() => handleSetNavigationType(NavigationType.REGULAR, setPrevPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${prevFilteredText}`}>
                            <Icon
                                className='cvat-player-previous-filtered-inlined-button'
                                component={PreviousFilteredIcon}
                                onClick={() => handleSetNavigationType(NavigationType.FILTERED, setPrevPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${prevEmptyText}`}>
                            <Icon
                                className='cvat-player-previous-empty-inlined-button'
                                component={PreviousEmptyIcon}
                                onClick={() => handleSetNavigationType(NavigationType.EMPTY, setPrevPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${prevLabelText}`}>
                            <Icon
                                className='cvat-player-previous-label-inlined-button'
                                component={PreviousLabelIcon}
                                onClick={() => handleSetNavigationType(NavigationType.BY_LABEL, setPrevPopoverVisible)}
                            />
                        </CVATTooltip>
                    </>
                )}
            >
                <CVATTooltip placement='top' title={`${prevButtonTooltipMessage} ${previousFrameShortcut}`}>
                    {prevButton}
                </CVATTooltip>
            </Popover>

            {!playing ? (
                <CVATTooltip placement='top' title={`Play ${playPauseShortcut}`}>
                    <Icon
                        style={navIconStyle}
                        className='cvat-player-play-button'
                        component={PlayIcon}
                        onClick={onSwitchPlay}
                    />
                </CVATTooltip>
            ) : (
                <CVATTooltip placement='top' title={`Pause ${playPauseShortcut}`}>
                    <Icon
                        style={navIconStyle}
                        className='cvat-player-pause-button'
                        component={PauseIcon}
                        onClick={onSwitchPlay}
                    />
                </CVATTooltip>
            )}

            <Popover
                trigger='contextMenu'
                placement='bottom'
                overlayInnerStyle={{ padding: '8px 16px' }}
                open={nextPopoverVisible}
                onOpenChange={setNextPopoverVisible}
                content={(
                    <>
                        <CVATTooltip placement='bottom' title={`${nextRegularText}`}>
                            <Icon
                                className='cvat-player-next-inlined-button'
                                component={NextIcon}
                                onClick={() => handleSetNavigationType(NavigationType.REGULAR, setNextPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${nextFilteredText}`}>
                            <Icon
                                className='cvat-player-next-filtered-inlined-button'
                                component={NextFilteredIcon}
                                onClick={() => handleSetNavigationType(NavigationType.FILTERED, setNextPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${nextEmptyText}`}>
                            <Icon
                                className='cvat-player-next-empty-inlined-button'
                                component={NextEmptyIcon}
                                onClick={() => handleSetNavigationType(NavigationType.EMPTY, setNextPopoverVisible)}
                            />
                        </CVATTooltip>
                        <CVATTooltip placement='bottom' title={`${nextLabelText}`}>
                            <Icon
                                className='cvat-player-next-label-inlined-button'
                                component={NextLabelIcon}
                                onClick={() => handleSetNavigationType(NavigationType.BY_LABEL, setNextPopoverVisible)}
                            />
                        </CVATTooltip>
                    </>
                )}
            >
                <CVATTooltip placement='top' title={`${nextButtonTooltipMessage} ${nextFrameShortcut}`}>
                    {nextButton}
                </CVATTooltip>
            </Popover>
            <CVATTooltip placement='top' title={`Go next with a step ${forwardShortcut}`}>
                <Icon
                    style={navIconStyle}
                    className='cvat-player-forward-button'
                    component={ForwardJumpIcon}
                    onClick={onForward}
                />
            </CVATTooltip>
            <CVATTooltip placement='top' title='Go to the last frame'>
                <Icon
                    style={navIconStyle}
                    className='cvat-player-last-button'
                    component={LastIcon}
                    onClick={onLastFrame}
                />
            </CVATTooltip>
        </Col>
    );
}

export default React.memo(PlayerButtons);
