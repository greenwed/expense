import Foundation
import Cocoa
import CoreGraphics

func createIcon(size: CGFloat, isRound: Bool, isForegroundOnly: Bool) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }

    let rect = CGRect(x: 0, y: 0, width: size, height: size)

    if !isForegroundOnly {
        // Draw Background
        ctx.saveGState()
        let path: CGPath
        if isRound {
            path = CGPath(ellipseIn: rect.insetBy(dx: size * 0.04, dy: size * 0.04), transform: nil)
        } else {
            let cornerRadius = size * 0.28 // Smooth organic squircle corner
            path = CGPath(roundedRect: rect.insetBy(dx: size * 0.04, dy: size * 0.04), cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
        }
        ctx.addPath(path)
        ctx.clip()

        // Vibrant Violet-Indigo Gradient matching image 2
        let colors = [
            NSColor(red: 124/255, green: 58/255, blue: 237/255, alpha: 1.0).cgColor,
            NSColor(red: 91/255, green: 80/255, blue: 230/255, alpha: 1.0).cgColor,
            NSColor(red: 79/255, green: 70/255, blue: 229/255, alpha: 1.0).cgColor
        ] as CFArray
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.0, 0.5, 1.0])!
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size), end: CGPoint(x: size, y: 0), options: [])
        ctx.restoreGState()
    }

    // Draw Rupee Symbol (₹)
    ctx.saveGState()
    ctx.setStrokeColor(NSColor.white.cgColor)
    ctx.setFillColor(NSColor.clear.cgColor)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)

    let scale = (size / 108.0) * (isForegroundOnly ? 0.9 : 0.82)
    let offsetX = (size - (108.0 * scale)) / 2.0
    let offsetY = (size - (108.0 * scale)) / 2.0

    ctx.translateBy(x: offsetX, y: offsetY)
    ctx.scaleBy(x: scale, y: scale)

    // Stroke width
    ctx.setLineWidth(6.0)

    // 1. Top bar: (34, 73) -> (74, 73) in standard Cocoa coords
    ctx.move(to: CGPoint(x: 34, y: 108 - 35))
    ctx.addLine(to: CGPoint(x: 74, y: 108 - 35))
    ctx.strokePath()

    // 2. Second bar: (34, 61) -> (66, 61)
    ctx.move(to: CGPoint(x: 34, y: 108 - 47))
    ctx.addLine(to: CGPoint(x: 66, y: 108 - 47))
    ctx.strokePath()

    // 3. Upper loop arc
    let loopPath = CGMutablePath()
    loopPath.move(to: CGPoint(x: 47, y: 108 - 35))
    loopPath.addLine(to: CGPoint(x: 47, y: 108 - 59))
    loopPath.addCurve(to: CGPoint(x: 67, y: 108 - 47),
                      control1: CGPoint(x: 62, y: 108 - 59),
                      control2: CGPoint(x: 67, y: 108 - 54))
    loopPath.addCurve(to: CGPoint(x: 47, y: 108 - 35),
                      control1: CGPoint(x: 67, y: 108 - 40),
                      control2: CGPoint(x: 62, y: 108 - 35))
    ctx.addPath(loopPath)
    ctx.strokePath()

    // 4. Downward diagonal leg
    ctx.move(to: CGPoint(x: 45, y: 108 - 59))
    ctx.addLine(to: CGPoint(x: 71, y: 108 - 77))
    ctx.strokePath()

    ctx.restoreGState()

    img.unlockFocus()
    return img
}

func savePNG(image: NSImage, path: String) {
    guard let tiffData = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiffData),
          let pngData = rep.representation(using: .png, properties: [:]) else {
        print("Failed to generate PNG for \(path)")
        return
    }
    try? pngData.write(to: URL(fileURLWithPath: path))
    print("Saved \(path)")
}

let basePath = "/Users/karthi-8017/Karthik/Others/Expense"
let resPath = "\(basePath)/ExpenseApp/android/app/src/main/res"

let densities: [(String, CGFloat)] = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192)
]

for (folder, size) in densities {
    let dir = "\(resPath)/\(folder)"
    try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
    
    // Standard Squircle Launcher Icon
    let icon = createIcon(size: size, isRound: false, isForegroundOnly: false)
    savePNG(image: icon, path: "\(dir)/ic_launcher.png")
    
    // Round Launcher Icon
    let iconRound = createIcon(size: size, isRound: true, isForegroundOnly: false)
    savePNG(image: iconRound, path: "\(dir)/ic_launcher_round.png")
    
    // Adaptive Foreground Icon (scaled for 108dp canvas)
    let iconFg = createIcon(size: size * 2.25, isRound: false, isForegroundOnly: true)
    savePNG(image: iconFg, path: "\(dir)/ic_launcher_foreground.png")
}

// 512x512 Master icons
let master512 = createIcon(size: 512, isRound: false, isForegroundOnly: false)
savePNG(image: master512, path: "\(basePath)/public/icon-512.png")
savePNG(image: master512, path: "\(basePath)/ExpenseApp/public/icon-512.png")

// 192x192 Favicons
let fav192 = createIcon(size: 192, isRound: false, isForegroundOnly: false)
savePNG(image: fav192, path: "\(basePath)/public/favicon.png")
savePNG(image: fav192, path: "\(basePath)/ExpenseApp/public/favicon.png")

// Splash Screen
let splash = createIcon(size: 384, isRound: false, isForegroundOnly: false)
savePNG(image: splash, path: "\(resPath)/drawable/splash.png")

print("Generated clean Rupee icons!")
