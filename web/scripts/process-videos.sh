#!/bin/bash
set -e

cd "$(dirname "$0")/.."

SHOWCASE_DIR=".showcase"
PUBLIC_DIR="public/showcase"
DOCS_DIR="../docs/showcase"

mkdir -p "$PUBLIC_DIR"
mkdir -p "$DOCS_DIR"

# The three workflow videos (largest files, in reverse chronological order)
PRIVACY_VIDEO="page@bf4d366643af3555a293d1a0bc211636.webm"    # 2.9M - Privacy & Governance
CHAT_VIDEO="page@7728aecb6540866a8b9a23b1c9976a28.webm"       # 1.1M - Chat Like a Persona
EXPLORE_VIDEO="page@35fbee32d176469492ffbaf06438d5a7.webm"    # 1.6M - Explore Personas

echo "🎬 Processing videos with ffmpeg..."
echo ""

# Function to convert webm to MP4 (for web)
convert_to_mp4() {
  local input="$SHOWCASE_DIR/$1"
  local output="$PUBLIC_DIR/$2"
  echo "Converting $1 → $2 (MP4 for web)..."
  ffmpeg -i "$input" -c:v libx264 -crf 28 -preset medium -movflags +faststart -an "$output" -y -loglevel error
  local size=$(du -h "$output" | cut -f1)
  echo "  ✓ Created $output ($size)"
}

# Function to convert webm to optimized GIF (for README)
convert_to_gif() {
  local input="$SHOWCASE_DIR/$1"
  local output="$DOCS_DIR/$2"
  echo "Converting $1 → $2 (GIF for README)..."

  # Generate palette first for better quality
  local palette="/tmp/palette-$RANDOM.png"
  ffmpeg -i "$input" -vf "fps=10,scale=960:-1:flags=lanczos,palettegen=max_colors=128" "$palette" -y -loglevel error

  # Convert using the palette
  ffmpeg -i "$input" -i "$palette" -lavfi "fps=10,scale=960:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5" "$output" -y -loglevel error

  rm "$palette"

  local size=$(du -h "$output" | cut -f1)
  echo "  ✓ Created $output ($size)"
}

# Process workflow 1: Explore Personas
echo "1️⃣  Explore Personas workflow"
convert_to_mp4 "$EXPLORE_VIDEO" "01-explore-personas.mp4"
convert_to_gif "$EXPLORE_VIDEO" "01-explore-personas.gif"
echo ""

# Process workflow 2: Chat Like a Persona
echo "2️⃣  Chat Like a Persona workflow"
convert_to_mp4 "$CHAT_VIDEO" "02-chat-persona.mp4"
convert_to_gif "$CHAT_VIDEO" "02-chat-persona.gif"
echo ""

# Process workflow 3: Privacy & Governance
echo "3️⃣  Privacy & Governance workflow"
convert_to_mp4 "$PRIVACY_VIDEO" "03-privacy-governance.mp4"
convert_to_gif "$PRIVACY_VIDEO" "03-privacy-governance.gif"
echo ""

# Extract poster frames from MP4s
echo "📸 Extracting poster frames..."
ffmpeg -i "$PUBLIC_DIR/01-explore-personas.mp4" -vf "select=eq(n\,0)" -frames:v 1 "$PUBLIC_DIR/01-explore-personas-poster.jpg" -y -loglevel error
ffmpeg -i "$PUBLIC_DIR/02-chat-persona.mp4" -vf "select=eq(n\,0)" -frames:v 1 "$PUBLIC_DIR/02-chat-persona-poster.jpg" -y -loglevel error
ffmpeg -i "$PUBLIC_DIR/03-privacy-governance.mp4" -vf "select=eq(n\,0)" -frames:v 1 "$PUBLIC_DIR/03-privacy-governance-poster.jpg" -y -loglevel error
echo "  ✓ Created poster frames"
echo ""

echo "✅ Video processing complete!"
echo ""
echo "MP4 files (for web): $PUBLIC_DIR/*.mp4"
echo "GIF files (for README): $DOCS_DIR/*.gif"
echo "Poster frames: $PUBLIC_DIR/*-poster.jpg"
