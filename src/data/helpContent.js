export const HELP_CONTENT = {
    link: {
        title: 'Point-to-Point Analysis',
        summary: 'Simulate a direct radio link between two physical locations.',
        steps: [
            'Step 1: Select a starting point (Transmitter).',
            'Step 2: Select an end point (Receiver).',
            'Analysis: The engine calculates path loss, Fresnel obstruction, and RSSI.'
        ],
        extra: 'Dynamic: Adjust Node A/B height, gain, or power in the sidebar to update the link live!'
    },
    coverage: { // Used for 'auto' mode in optimization
        title: 'How to Scan',
        summary: 'Identify optimal reception locations within a radius.',
        steps: [
            'Step 1: Click map to place your Transmitter (Center).',
            'Step 2: Move mouse to define coverage radius. Click to Scan.',
            'Result: Best reception spots are ranked by LOS and Signal Strength.'
        ]
    },
    multiSite: { // Used for 'manual' mode in optimization
        title: 'Multi-Site Management',
        summary: 'Manually place and compare multiple potential locations.',
        steps: [
            'Add: Click "Add" in the panel or click the map to place a candidate marker.',
            'Compare: Toggle candidates in the list to view their coverage stats.',
            'Convert: Promote a candidate to a permanent primary node.'
        ]
    },
    viewshed: {
        title: 'Optical Line-of-Sight',
        summary: 'Shows what is physically visible from the chosen point based on 10m-30m terrain data.',
        steps: [
            'Purple Area: Visible (LOS)',
            'Clear Area: Obstructed by terrain',
            'Draggable: Move the marker to instantly re-calculate.'
        ]
    },
    rfSimulator: {
        title: 'RF Propagation Simulation',
        summary: 'Uses ITM / Geodetic physics to model radio coverage across terrain.',
        steps: [
            'Colors: Hotter (Green/Yellow) is stronger signal. Purple is weak.',
            'Params: Uses TX Power, Gain, and Height from sidebar.',
            'Receiver: Adjust Receiver Height in the sidebar to simulate ground vs. mast reception.',
            'Updates: If you change hardware settings, click Update Calculation in the sidebar to refresh the map.',
            'Sensitivity: Dotted area shows coverage above your radio\'s floor.'
        ]
    }
};
