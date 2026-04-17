const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const skipWebpConvert = new Set(['logo.png', 'favicon.png', 'og-preview.png', 'hero-placeholder.jpg', 'placeholder-profile.jpg']);

async function processHtmlFiles() {
    for (const file of htmlFiles) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Match all img tags
        const imgRegex = /<img([^>]+)>/gi;
        let match;
        const replacements = [];

        while ((match = imgRegex.exec(content)) !== null) {
            const originalTag = match[0];
            let newTag = originalTag;
            let srcMatch = newTag.match(/src=["']([^"']+)["']/i);
            
            if (srcMatch) {
                let src = srcMatch[1];
                let parsedPath = path.parse(src);
                let filename = parsedPath.base;

                // 1. Swap backslashes to forward slashes for universal web pathing
                if (src.includes('\\')) {
                    newTag = newTag.replace(src, src.replace(/\\/g, '/'));
                    src = src.replace(/\\/g, '/');
                }

                // 2. Convert to webp if applicable
                if ((filename.endsWith('.jpg') || filename.endsWith('.png') || filename.endsWith('.jpeg')) && !skipWebpConvert.has(filename)) {
                    const webpSrc = src.replace(/\.(jpeg|jpg|png)$/i, '.webp');
                    newTag = newTag.replace(src, webpSrc);
                    src = webpSrc;
                    filename = path.parse(src).base;
                }

                // 3. Ensure explicit width and height
                if (!newTag.includes('width=') || !newTag.includes('height=')) {
                    const localPath = path.join(dir, src);
                    if (fs.existsSync(localPath)) {
                        try {
                            const meta = await sharp(localPath).metadata();
                            // If height is enormous (e.g. roshmalai 3), we might want to scale attributes but aspect ratio is what matters
                            // For simplicity, just inject intrinsic
                            if (meta.width && meta.height) {
                                // Add width and height right before the closing >
                                newTag = newTag.replace(/\/?>$/, ` width="${meta.width}" height="${meta.height}">`);
                            }
                        } catch (e) {
                            console.error(`Error reading metadata for ${localPath}:`, e.message);
                        }
                    }
                }

                 // 4. Add loading="lazy" if it's not a hero image (hero logo has fetchpriority high or is explicitly important)
                if (!newTag.includes('loading=') && !newTag.includes('fetchpriority=')) {
                    newTag = newTag.replace(/\/?>$/, ` loading="lazy">`);
                }
            }
            
            if (originalTag !== newTag) {
                replacements.push({ original: originalTag, new: newTag });
            }
        }

        // Apply all replacements
        for (const replacement of replacements) {
            content = content.replace(replacement.original, replacement.new);
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated images in ${file}`);
    }
}

processHtmlFiles().catch(console.error);
