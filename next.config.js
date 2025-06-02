/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['192.168.1.116', 'localhost']
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ttf$/, // Apply rule to files ending in .ttf
      use: [
        {
          loader: 'url-loader', // Use url-loader to handle the files
          options: {
            limit: false, // Do not inline the font files as data URLs
            name: 'static/media/[name].[hash:8].[ext]', // Output path and filename
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig; 