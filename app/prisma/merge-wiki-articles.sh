#!/bin/bash

echo "📝 Merging wiki articles..."

# Backup original file
cp seed-wiki.ts seed-wiki.ts.backup

# Extract first 4402 lines (everything before console.log)
head -n 4402 seed-wiki.ts > seed-wiki-temp.ts

# Add articles 5-7 from batch-2 (skip first 3 lines of comments)
echo "  // Articles 5-7 from batch file" >> seed-wiki-temp.ts
sed -n '4,1000p' seed-wiki-batch-2.ts >> seed-wiki-temp.ts

# Add the closing lines
tail -n 12 seed-wiki.ts >> seed-wiki-temp.ts

# Replace original with merged version
mv seed-wiki-temp.ts seed-wiki.ts

echo "✅ Merged articles 5-7 successfully!"
echo "📊 New file size: $(wc -l seed-wiki.ts | awk '{print $1}') lines"

