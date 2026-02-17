// global_mouse_tracker_linux.c - Linux global mouse event tracker
// Compile: gcc -o global_mouse_tracker global_mouse_tracker_linux.c $(pkg-config --cflags --libs x11)
#include <X11/Xlib.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define GRID_COLS 15
#define GRID_ROWS 11

int overlayX = 0;
int overlayY = 0;
int overlayWidth = 600;
int overlayHeight = 440;

int lastClickX = 0;
int lastClickY = 0;
double lastClickTime = 0;

void printTileAtPoint(int x, int y) {
    if (x < overlayX || x >= overlayX + overlayWidth ||
        y < overlayY || y >= overlayY + overlayHeight) {
        return;
    }
    
    int relX = x - overlayX;
    int relY = y - overlayY;
    
    float tileWidth = (float)overlayWidth / GRID_COLS;
    float tileHeight = (float)overlayHeight / GRID_ROWS;
    
    int col = (int)(relX / tileWidth);
    int row = (int)(relY / tileHeight);
    
    if (col < 0) col = 0;
    if (col >= GRID_COLS) col = GRID_COLS - 1;
    if (row < 0) row = 0;
    if (row >= GRID_ROWS) row = GRID_ROWS - 1;
    
    printf("TILE_CLICKED %d %d %d %d\n", col, row, x, y);
    fflush(stdout);
}

int main(int argc, char *argv[]) {
    if (argc >= 5) {
        overlayX = atoi(argv[1]);
        overlayY = atoi(argv[2]);
        overlayWidth = atoi(argv[3]);
        overlayHeight = atoi(argv[4]);
    }
    
    Display *display = XOpenDisplay(NULL);
    if (!display) {
        fprintf(stderr, "Failed to open X display\n");
        return 1;
    }
    
    printf("Mouse tracker started\n");
    printf("Overlay bounds: x=%d y=%d w=%d h=%d\n", overlayX, overlayY, overlayWidth, overlayHeight);
    printf("Monitoring for clicks...\n");
    fflush(stdout);
    
    Window root = DefaultRootWindow(display);
    
    XGrabPointer(display, root, False, ButtonPressMask | ButtonReleaseMask, GrabModeAsync, GrabModeAsync, None, None, CurrentTime);
    
    XEvent event;
    while (1) {
        XNextEvent(display, &event);
        
        if (event.type == ButtonPress || event.type == ButtonRelease) {
            int x = event.xbutton.x;
            int y = event.xbutton.y;
            
            double now = (double)clock() / CLOCKS_PER_SEC;
            
            double dist = sqrt(pow(x - lastClickX, 2) + pow(y - lastClickY, 2));
            if (dist < 5 && (now - lastClickTime) < 0.1) {
                continue;
            }
            
            lastClickX = x;
            lastClickY = y;
            lastClickTime = now;
            
            if (x >= overlayX && x < overlayX + overlayWidth &&
                y >= overlayY && y < overlayY + overlayHeight) {
                printTileAtPoint(x, y);
            }
        }
    }
    
    XCloseDisplay(display);
    return 0;
}
