/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: {
        buildActivity: false, // Disables build activity indicator
        autoPrerender: false, // Hides the static/dynamic route indicators
    },
};

export default nextConfig;
