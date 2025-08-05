# Icons Directory

This directory should contain the extension icons:

- `icon16.png` - 16x16 pixels (for the extension toolbar)
- `icon48.png` - 48x48 pixels (for the extension management page)
- `icon128.png` - 128x128 pixels (for the Chrome Web Store)

## Creating Icons

You can create these icons using any image editor. Here are the specifications:

### Design Guidelines
- Use a lock (🔒) or focus-related symbol
- Keep the design simple and recognizable at small sizes
- Use colors that match the extension theme (blues and purples)
- Ensure good contrast against both light and dark backgrounds

### Quick Icon Creation
If you don't have custom icons, you can:

1. Use online icon generators
2. Convert emoji to PNG using online tools
3. Use free icon resources like Feather Icons or Heroicons
4. Create simple geometric designs in tools like Canva or Figma

### Temporary Solution
For testing purposes, you can:
1. Create solid color squares with the lock emoji
2. Use any PNG files renamed to the correct sizes
3. The extension will work without icons, but they improve the user experience

Remember to update the `manifest.json` file if you change the icon filenames or add additional sizes.