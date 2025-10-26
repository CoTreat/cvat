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
    },
    transformIgnorePatterns: [
        'node_modules/(?!(antd|@ant-design|rc-.*|@babel/runtime)/)',
    ],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
        '^antd/lib/card$': '<rootDir>/src/__mocks__/antd-lib-card.tsx',
        '^antd/lib/descriptions$': '<rootDir>/src/__mocks__/antd-lib-descriptions.tsx',
        '^antd/lib/typography/Text$': '<rootDir>/src/__mocks__/antd-lib-typography-text.tsx',
        '^antd$': '<rootDir>/src/__mocks__/antd.tsx',
        '^@ant-design/icons$': '<rootDir>/src/__mocks__/@ant-design-icons.tsx',
        '^components/(.*)$': '<rootDir>/src/components/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^reducers$': '<rootDir>/src/reducers/index.ts',
        '^cvat-core-wrapper$': '<rootDir>/src/__mocks__/cvat-core-wrapper.ts',
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
