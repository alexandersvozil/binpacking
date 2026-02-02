// ==================== CONFIGURATION ====================
// Internal units: 1 unit = 1 inch (for display), scaled by SCALE for 3D rendering
export const SCALE = 0.08; // 1 inch = 0.08 3D units (so 12" = ~1 unit in 3D)

export const CONFIG = {
    cart: { width: 12, depth: 12, height: 14 }, // inches
    maxPackagesPerCart: 50,
    // Package sizes in inches (typical small shipping boxes)
    packageTypes: [
        { name: 'Small Box', w: 3, d: 3, h: 2, color: 0xf4a460 },
        { name: 'Medium Box', w: 4, d: 3.5, h: 3, color: 0xdeb887 },
        { name: 'Padded Envelope', w: 5, d: 4, h: 1.5, color: 0xcd853f },
        { name: 'Cube Box', w: 3.5, d: 3.5, h: 3.5, color: 0xbc8f8f },
        { name: 'Tall Box', w: 3, d: 3, h: 5, color: 0xa0522d },
        { name: 'Wide Box', w: 6, d: 3, h: 2, color: 0x8b4513 },
        { name: 'Book Mailer', w: 5, d: 4, h: 2, color: 0xd2691e },
        { name: 'Long Box', w: 7, d: 2.5, h: 2.5, color: 0xf5deb3 }
    ],
    conveyorSpeed: 3,
    dropSpeed: 6
};
