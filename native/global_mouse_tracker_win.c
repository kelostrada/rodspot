// global_mouse_tracker_win.c - Windows global mouse event tracker
// Compile with MinGW: gcc -o global_mouse_tracker.exe global_mouse_tracker_win.c -luser32 -lgdi32
// Or with MSVC: cl /Fe:global_mouse_tracker.exe global_mouse_tracker_win.c user32.lib gdi32.lib

#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define GRID_COLS 15
#define GRID_ROWS 11

int overlayX = 0;
int overlayY = 0;
int overlayWidth = 600;
int overlayHeight = 440;

POINT lastClickPoint = {0, 0};
double lastClickTime = 0;

HHOOK mouseHook = NULL;

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

LRESULT CALLBACK MouseProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        MSLLHOOKSTRUCT *pMouseStruct = (MSLLHOOKSTRUCT *)lParam;
        
        if (wParam == WM_LBUTTONDOWN || wParam == WM_RBUTTONDOWN) {
            int x = pMouseStruct->pt.x;
            int y = pMouseStruct->pt.y;
            
            double now = (double)GetTickCount() / 1000.0;
            
            double dist = sqrt(pow(x - lastClickPoint.x, 2) + pow(y - lastClickPoint.y, 2));
            if (dist < 5 && (now - lastClickTime) < 0.1) {
                return CallNextHookEx(mouseHook, nCode, wParam, lParam);
            }
            
            lastClickPoint.x = x;
            lastClickPoint.y = y;
            lastClickTime = now;
            
            if (x >= overlayX && x < overlayX + overlayWidth &&
                y >= overlayY && y < overlayY + overlayHeight) {
                printTileAtPoint(x, y);
            }
        }
    }
    
    return CallNextHookEx(mouseHook, nCode, wParam, lParam);
}

int main(int argc, char *argv[]) {
    if (argc >= 5) {
        overlayX = atoi(argv[1]);
        overlayY = atoi(argv[2]);
        overlayWidth = atoi(argv[3]);
        overlayHeight = atoi(argv[4]);
    }
    
    printf("Mouse tracker started\n");
    printf("Overlay bounds: x=%d y=%d w=%d h=%d\n", overlayX, overlayY, overlayWidth, overlayHeight);
    printf("Monitoring for clicks...\n");
    fflush(stdout);
    
    mouseHook = SetWindowsHookEx(WH_MOUSE_LL, MouseProc, NULL, 0);
    
    if (!mouseHook) {
        fprintf(stderr, "Failed to create mouse hook. Try running with administrator privileges.\n");
        return 1;
    }
    
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    UnhookWindowsHookEx(mouseHook);
    
    return 0;
}
