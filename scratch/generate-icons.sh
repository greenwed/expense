#!/bin/bash
set -e

SOURCE_IMG="/Users/karthi-8017/.gemini/antigravity/brain/e41e6ac5-cb68-4802-a00c-5aac24d7b4cd/rupeetrack_app_icon_1788254779377.jpg"
BASE_DIR="/Users/karthi-8017/Karthik/Others/Expense"
RES_DIR="$BASE_DIR/ExpenseApp/android/app/src/main/res"

echo "🎨 Converting source image to base PNG..."
sips -s format png "$SOURCE_IMG" --out "$BASE_DIR/public/icon-512.png" > /dev/null
sips -z 512 512 "$BASE_DIR/public/icon-512.png" > /dev/null

cp "$BASE_DIR/public/icon-512.png" "$BASE_DIR/ExpenseApp/public/icon-512.png"

# Favicon PNG
sips -z 64 64 "$BASE_DIR/public/icon-512.png" --out "$BASE_DIR/public/favicon.png" > /dev/null
cp "$BASE_DIR/public/favicon.png" "$BASE_DIR/ExpenseApp/public/favicon.png"

echo "📱 Generating Android Mipmap Icons..."
# mdpi (48x48)
sips -z 48 48 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-mdpi/ic_launcher.png" > /dev/null
sips -z 48 48 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-mdpi/ic_launcher_round.png" > /dev/null
sips -z 108 108 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-mdpi/ic_launcher_foreground.png" > /dev/null

# hdpi (72x72)
sips -z 72 72 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-hdpi/ic_launcher.png" > /dev/null
sips -z 72 72 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-hdpi/ic_launcher_round.png" > /dev/null
sips -z 162 162 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-hdpi/ic_launcher_foreground.png" > /dev/null

# xhdpi (96x96)
sips -z 96 96 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xhdpi/ic_launcher.png" > /dev/null
sips -z 96 96 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png" > /dev/null
sips -z 216 216 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_foreground.png" > /dev/null

# xxhdpi (144x144)
sips -z 144 144 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher.png" > /dev/null
sips -z 144 144 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png" > /dev/null
sips -z 324 324 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_foreground.png" > /dev/null

# xxxhdpi (192x192)
sips -z 192 192 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png" > /dev/null
sips -z 192 192 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png" > /dev/null
sips -z 432 432 "$BASE_DIR/public/icon-512.png" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_foreground.png" > /dev/null

# Splash Screen
if [ -f "$RES_DIR/drawable/splash.png" ]; then
  cp "$BASE_DIR/public/icon-512.png" "$RES_DIR/drawable/splash.png"
fi

echo "✅ All Android and Web RupeeTrack icons generated successfully!"
