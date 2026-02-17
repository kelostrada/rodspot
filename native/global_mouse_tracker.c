// global_mouse_tracker.c - macOS global mouse event tracker
// Compile: gcc -framework ApplicationServices -o global_mouse_tracker global_mouse_tracker.c
#include <ApplicationServices/ApplicationServices.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// Grid configuration (matches the overlay)
#define GRID_COLS 15
#define GRID_ROWS 11

// Overlay bounds (will be set via command line args)
int overlayX = 0;
int overlayY = 0;
int overlayWidth = 600;
int overlayHeight = 440;

// Track last click to avoid duplicates
CGPoint lastClickPoint = {0, 0};
CFTimeInterval lastClickTime = 0;

void printTileAtPoint(int x, int y) {
    // Check if point is within overlay bounds
    if (x < overlayX || x >= overlayX + overlayWidth ||
        y < overlayY || y >= overlayY + overlayHeight) {
        return; // Outside overlay
    }
    
    // Calculate relative position within overlay
    int relX = x - overlayX;
    int relY = y - overlayY;
    
    // Calculate tile
    float tileWidth = (float)overlayWidth / GRID_COLS;
    float tileHeight = (float)overlayHeight / GRID_ROWS;
    
    int col = (int)(relX / tileWidth);
    int row = (int)(relY / tileHeight);
    
    // Clamp to valid range
    if (col < 0) col = 0;
    if (col >= GRID_COLS) col = GRID_COLS - 1;
    if (row < 0) row = 0;
    if (row >= GRID_ROWS) row = GRID_ROWS - 1;
    
    fprintf(stderr, "TILE_CLICKED %d %d %d %d\n", col, row, x, y);
}

CGEventRef mouseCallback(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void *refcon) {
    CGPoint location = CGEventGetLocation(event);
    int x = (int)location.x;
    int y = (int)location.y;
    
    CFTimeInterval now = CFAbsoluteTimeGetCurrent();
    
    switch (type) {
        case kCGEventLeftMouseDown:
        case kCGEventRightMouseDown: {
            // Debounce - ignore clicks too close together at same location
            float dist = sqrt(pow(x - lastClickPoint.x, 2) + pow(y - lastClickPoint.y, 2));
            if (dist < 5 && (now - lastClickTime) < 0.1) {
                return event; // Too soon, probably same click
            }
            
            lastClickPoint = location;
            lastClickTime = now;
            
            // Check if within overlay bounds
            if (x >= overlayX && x < overlayX + overlayWidth &&
                y >= overlayY && y < overlayY + overlayHeight) {
                printTileAtPoint(x, y);
            }
            break;
        }
        default:
            break;
    }
    
    return event; // Don't intercept, let it pass through
}

int main(int argc, char *argv[]) {
    if (argc >= 5) {
        overlayX = atoi(argv[1]);
        overlayY = atoi(argv[2]);
        overlayWidth = atoi(argv[3]);
        overlayHeight = atoi(argv[4]);
    }
    
    fprintf(stderr, "Mouse tracker started\n");
    fprintf(stderr, "Overlay bounds: x=%d y=%d w=%d h=%d\n", overlayX, overlayY, overlayWidth, overlayHeight);
    fprintf(stderr, "Monitoring for clicks...\n");
    
    // Create event tap for mouse events
    CGEventMask eventMask = (1 << kCGEventLeftMouseDown) | (1 << kCGEventRightMouseDown);
    CFMachPortRef tap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionListenOnly, // Don't intercept, just listen
        eventMask,
        mouseCallback,
        NULL
    );
    
    if (!tap) {
        fprintf(stderr, "Failed to create event tap. Try running with sudo or granting accessibility permissions.\n");
        return 1;
    }
    
    // Create run loop source
    CFRunLoopSourceRef runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, kCFRunLoopCommonModes);
    
    // Enable the tap
    CGEventTapEnable(tap, true);
    
    // Run the loop
    CFRunLoopRun();
    
    // Cleanup
    CFRunLoopRemoveSource(CFRunLoopGetCurrent(), runLoopSource, kCFRunLoopCommonModes);
    CFRelease(runLoopSource);
    CFRelease(tap);
    
    return 0;
}
