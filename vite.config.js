export default {
  server: {
    port: 5173, // Changed to Vite's default port
    host: true,  // Added to allow connections from network
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep model and texture files in their original paths
          if (assetInfo.name.match(/\.(gltf|bin)$/)) {
            return '[name][extname]';
          }
          if (assetInfo.name.match(/texture\/.+\.(jpg|png)$/)) {
            return '[name][extname]';
          }
          // Put other assets in the assets directory
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Treat these files as assets
  assetsInclude: ['**/*.gltf', '**/*.bin', '**/texture/*.jpg', '**/texture/*.png'],
  // Preserve these file names
  publicDir: 'public'
}
