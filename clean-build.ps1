# Clean Build Script

# Delete build artifacts
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Rebuild
npm run build
