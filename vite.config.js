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
          // Keep GLTF and BIN files in the root directory
          if (assetInfo.name.endsWith('.gltf') || assetInfo.name.endsWith('.bin')) {
            return '[name][extname]';
          }
          // Put other assets in the assets directory
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Treat these files as assets
  assetsInclude: ['**/*.gltf', '**/*.bin'],
  // Preserve these file names
  publicDir: 'public'
}
