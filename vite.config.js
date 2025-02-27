export default {
  server: {
    port: 5173, // Changed to Vite's default port
    host: true,  // Added to allow connections from network
    open: true
  },
  assetsInclude: ['**/*.gltf', '**/*.bin'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.gltf')) {
            return '[name][extname]';
          }
          if (assetInfo.name.endsWith('.bin')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
}
