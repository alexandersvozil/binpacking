// ==================== CONFIGURATION ====================
// Internal units: 1 unit = 1 inch (for display), scaled by SCALE for 3D rendering
export const SCALE = 0.04; // 1 inch = 0.04 3D units (adjusted for larger cart)

export const CONFIG = {
    cart: { width: 24, depth: 18, height: 24 }, // inches - typical warehouse tote/bin
    maxPackagesPerCart: 50,
    // Package sizes in inches (realistic shipping boxes - USPS/UPS/FedEx standard sizes)
    packageTypes: [
        { name: 'Small Mailer', w: 6, d: 4, h: 2, color: 0xf4a460 },           // Padded envelope
        { name: 'Shoe Box', w: 12, d: 6, h: 4, color: 0xdeb887 },              // Standard shoe box
        { name: 'Small Box', w: 8, d: 6, h: 4, color: 0xcd853f },              // USPS Small Flat Rate
        { name: 'Medium Box', w: 11, d: 8.5, h: 5.5, color: 0xbc8f8f },        // USPS Medium Flat Rate
        { name: 'Large Box', w: 12, d: 12, h: 6, color: 0xa0522d },            // Standard moving box
        { name: 'Book Box', w: 10, d: 8, h: 3, color: 0xd2691e },              // Book mailer
        { name: 'Cube Box', w: 8, d: 8, h: 8, color: 0x8b4513 },               // Cube-shaped box
        { name: 'Long Package', w: 14, d: 4, h: 4, color: 0xf5deb3 }           // Elongated package
    ],
    conveyorSpeed: 3,
    dropSpeed: 6
};
