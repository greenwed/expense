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
            path = CGPath(ellipseIn: rect.insetBy(dx: size * 0.02, dy: size * 0.02), transform: nil)
        } else {
            let cornerRadius = size * 0.22
            path = CGPath(roundedRect: rect.insetBy(dx: size * 0.02, dy: size * 0.02), cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
        }
        ctx.addPath(path)
        ctx.clip()

        // Gradient
        let colors = [
            NSColor(red: 124/255, green: 58/255, blue: 237/255, alpha: 1.0).cgColor,
            NSColor(red: 99/255, green: 102/255, blue: 241/255, alpha: 1.0).cgColor,
            NSColor(red: 79/255, green: 70/255, blue: 229/255, alpha: 1.0).cgColor
        ] as CFArray
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.0, 0.5, 1.0])!
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size), end: CGPoint(x: size, y: 0), options: [])
        ctx.restoreGState()

        // Subtle Inner Border
        ctx.saveGState()
        ctx.addPath(path)
        ctx.setStrokeColor(NSColor(white: 1.0, alpha: 0.25).cgColor)
        ctx.setLineWidth(size * 0.02)
        ctx.strokePath()
        ctx.restoreGState()
    }

    // Draw Rupee Symbol (₹)
    ctx.saveGState()
    ctx.setStrokeColor(NSColor.white.cgColor)
    ctx.setFillColor(NSColor.clear.cgColor)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)

    let scale = isForegroundOnly ? (size / 512.0) * 0.65 : (size / 512.0) * 0.85
    let offsetX = (size - (512.0 * scale)) / 2.0
    let offsetY = (size - (512.0 * scale)) / 2.0

    ctx.translateBy(x: offsetX, y: offsetY)
    ctx.scaleBy(x: scale, y: scale)

    // Thickness
    ctx.setLineWidth(42.0)

    // Upper line
    ctx.move(to: CGPoint(x: 145, y: 512 - 145))
    ctx.addLine(to: CGPoint(x: 367, y: 512 - 145))
    ctx.strokePath()

    // Second line
    ctx.move(to: CGPoint(x: 145, y: 512 - 225))
    ctx.addLine(to: CGPoint(x: 310, y: 512 - 225))
    ctx.strokePath()

    // Curved loop
    let loopPath = CGMutablePath()
    loopPath.move(to: CGPoint(x: 225, y: 512 - 145))
    loopPath.addLine(to: CGPoint(x: 225, y: 512 - 305))
    // arc/bezier for the rupee top half
    loopPath.addCurve(to: CGPoint(x: 320, y: 512 - 225),
                      control1: CGPoint(x: 300, y: 512 - 305),
                      control2: CGPoint(x: 320, y: 512 - 270))
    loopPath.addCurve(to: CGPoint(x: 225, y: 512 - 145),
                      control1: CGPoint(x: 320, y: 512 - 180),
                      control2: CGPoint(x: 300, y: 512 - 145))
    ctx.addPath(loopPath)
    ctx.strokePath()

    // Diagonal stroke
    ctx.move(to: CGPoint(x: 205, y: 512 - 305))
    ctx.addLine(to: CGPoint(x: 340, y: 512 - 415))
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
    
    // Adaptive Foreground (Rupee symbol on transparent background, size: 432 for adaptive)
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

print("All clean RupeeTrack icons generated successfully!")
