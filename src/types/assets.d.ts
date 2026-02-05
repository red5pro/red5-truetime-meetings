// types/assets.d.ts

// PNG image imports
declare module "*.png" {
    const value: string;
    export default value;
}

// Additional image formats
declare module "*.jpg" {
    const value: string;
    export default value;
}

declare module "*.jpeg" {
    const value: string;
    export default value;
}

declare module "*.gif" {
    const value: string;
    export default value;
}

declare module "*.svg" {
    const value: string;
    export default value;
}

declare module "*.webp" {
    const value: string;
    export default value;
}

declare module "*.ico" {
    const value: string;
    export default value;
}

declare module "*.bmp" {
    const value: string;
    export default value;
}

// For React SVG components (if using SVGR)
declare module "*.svg" {
    import React from "react";
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}