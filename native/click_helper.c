// click_helper.c - macOS mouse event forwarder
// Compile with: gcc -framework ApplicationServices -o click_helper click_helper.c
#include <ApplicationServices/ApplicationServices.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void postMouseEvent(CGEventType type, CGPoint point, CGMouseButton button) {
    CGEventRef event = CGEventCreateMouseEvent(NULL, type, point, button);
    if (event) {
        CGEventPost(kCGHIDEventTap, event);
        CFRelease(event);
    }
}

int main(int argc, char *argv[]) {
    if (argc < 4) {
        fprintf(stderr, "Usage: %s <event> <x> <y> [button]\n", argv[0]);
        fprintf(stderr, "Events: click, mousedown, mouseup, rightclick, drag\n");
        fprintf(stderr, "Button: left (default) or right\n");
        return 1;
    }
    
    const char* eventType = argv[1];
    float x = atof(argv[2]);
    float y = atof(argv[3]);
    const char* buttonStr = (argc >= 5) ? argv[4] : "left";
    
    CGPoint point = CGPointMake(x, y);
    CGMouseButton button = (strcmp(buttonStr, "right") == 0) ? kCGMouseButtonRight : kCGMouseButtonLeft;
    
    if (strcmp(eventType, "click") == 0) {
        // Left or right click
        CGEventType downType = (button == kCGMouseButtonRight) ? kCGEventRightMouseDown : kCGEventLeftMouseDown;
        CGEventType upType = (button == kCGMouseButtonRight) ? kCGEventRightMouseUp : kCGEventLeftMouseUp;
        
        postMouseEvent(downType, point, button);
        usleep(10000); // 10ms
        postMouseEvent(upType, point, button);
        printf("%s click at %.0f, %.0f\n", buttonStr, x, y);
    }
    else if (strcmp(eventType, "mousedown") == 0) {
        CGEventType downType = (button == kCGMouseButtonRight) ? kCGEventRightMouseDown : kCGEventLeftMouseDown;
        postMouseEvent(downType, point, button);
        printf("Mouse down (%s) at %.0f, %.0f\n", buttonStr, x, y);
    }
    else if (strcmp(eventType, "mouseup") == 0) {
        CGEventType upType = (button == kCGMouseButtonRight) ? kCGEventRightMouseUp : kCGEventLeftMouseUp;
        postMouseEvent(upType, point, button);
        printf("Mouse up (%s) at %.0f, %.0f\n", buttonStr, x, y);
    }
    else if (strcmp(eventType, "rightclick") == 0) {
        postMouseEvent(kCGEventRightMouseDown, point, kCGMouseButtonRight);
        usleep(10000);
        postMouseEvent(kCGEventRightMouseUp, point, kCGMouseButtonRight);
        printf("Right click at %.0f, %.0f\n", x, y);
    }
    else if (strcmp(eventType, "drag") == 0) {
        // Drag is just a move while holding the button
        // The button should already be held down from mousedown
        CGEventRef moveEvent = CGEventCreateMouseEvent(NULL, kCGEventMouseMoved, point, button);
        if (moveEvent) {
            CGEventPost(kCGHIDEventTap, moveEvent);
            CFRelease(moveEvent);
        }
        printf("Drag to %.0f, %.0f\n", x, y);
    }
    else {
        fprintf(stderr, "Unknown event type: %s\n", eventType);
        return 1;
    }
    
    return 0;
}
