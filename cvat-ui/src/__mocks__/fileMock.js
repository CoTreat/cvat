// Copyright (C) CoTreat Corporation
//
// SPDX-License-Identifier: MIT

const React = require('react');

// For SVG files that are imported as React components
module.exports = function MockSVGComponent(props) {
    return React.createElement('svg', props, null);
};

// Also export as default for default imports
module.exports.default = module.exports;
