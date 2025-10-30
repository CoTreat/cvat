// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                '@babel/preset-react',
            ],
        }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(antd|@ant-design|rc-.*|@babel/runtime|@rc-component)/)',
    ],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
        '^antd/lib/card$': '<rootDir>/src/__mocks__/antd-lib-card.tsx',
        '^antd/lib/descriptions$': '<rootDir>/src/__mocks__/antd-lib-descriptions.tsx',
        '^antd/lib/typography/Text$': '<rootDir>/src/__mocks__/antd-lib-typography-text.tsx',
        '^antd/lib/popover$': '<rootDir>/src/__mocks__/antd-lib-popover.tsx',
        '^antd$': '<rootDir>/src/__mocks__/antd.tsx',
        '^@ant-design/icons$': '<rootDir>/src/__mocks__/@ant-design-icons.tsx',
        '^components/(.*)$': '<rootDir>/src/components/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^actions/(.*)$': '<rootDir>/src/actions/$1',
        '^reducers/(.*)$': '<rootDir>/src/reducers/$1',
        '^reducers$': '<rootDir>/src/reducers/index.ts',
        '^cvat-core-wrapper$': '<rootDir>/src/__mocks__/cvat-core-wrapper.ts',
        '^cvat-canvas-wrapper$': '<rootDir>/src/__mocks__/cvat-canvas-wrapper.ts',
        '^cvat-canvas3d-wrapper$': '<rootDir>/src/__mocks__/cvat-canvas3d-wrapper.ts',
        '^cvat-logger$': '<rootDir>/src/__mocks__/cvat-logger.ts',
        '^cvat-store$': '<rootDir>/src/cvat-store',
        '^icons$': '<rootDir>/src/icons',
        '^config$': '<rootDir>/src/__mocks__/config.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/**/__tests__/**',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
