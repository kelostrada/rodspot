#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <io.h>
#include <fcntl.h>

#define GRID_COLS 15
#define GRID_ROWS 11
#define WM_CLICK_DETECTED (WM_USER + 1)

int overlayX = 0;
int overlayY = 0;
int overlayWidth = 600;
int overlayHeight = 440;

POINT lastClickPoint = {0, 0};
DWORD lastClickTime = 0;
HHOOK mouseHook = NULL;
HWND hwnd = NULL;
CRITICAL_SECTION cs;

void output(const char* msg) {
    EnterCriticalSection(&cs);
    _write(1, msg, strlen(msg));
    LeaveCriticalSection(&cs);
}

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
    
    char buf[128];
    _snprintf(buf, sizeof(buf), "TILE_CLICKED %d %d %d %d\n", col, row, x, y);
    output(buf);
}

LRESULT CALLBACK MouseProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && hwnd) {
        MSLLHOOKSTRUCT *pMouseStruct = (MSLLHOOKSTRUCT *)lParam;
        
        if (wParam == WM_LBUTTONDOWN || wParam == WM_RBUTTONDOWN) {
            int x = pMouseStruct->pt.x;
            int y = pMouseStruct->pt.y;
            
            DWORD now = GetTickCount();
            int dx = x - lastClickPoint.x;
            int dy = y - lastClickPoint.y;
            
            if (dx*dx + dy*dy >= 25 || (now - lastClickTime) >= 100) {
                lastClickPoint.x = x;
                lastClickPoint.y = y;
                lastClickTime = now;
                
                if (x >= overlayX && x < overlayX + overlayWidth &&
                    y >= overlayY && y < overlayY + overlayHeight) {
                    PostMessage(hwnd, WM_CLICK_DETECTED, (WPARAM)x, (LPARAM)y);
                }
            }
        }
    }
    
    return CallNextHookEx(mouseHook, nCode, wParam, lParam);
}

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    if (message == WM_CLICK_DETECTED) {
        printTileAtPoint((int)wParam, (int)lParam);
        return 0;
    }
    return DefWindowProc(hWnd, message, wParam, lParam);
}

int main(int argc, char *argv[]) {
    if (argc >= 5) {
        overlayX = atoi(argv[1]);
        overlayY = atoi(argv[2]);
        overlayWidth = atoi(argv[3]);
        overlayHeight = atoi(argv[4]);
    }
    
    InitializeCriticalSection(&cs);
    _setmode(1, _O_BINARY);
    
    WNDCLASS wc = {0};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = "RodSpotTracker";
    RegisterClass(&wc);
    
    hwnd = CreateWindowEx(0, "RodSpotTracker", NULL, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL);
    if (!hwnd) {
        output("Failed to create window\n");
        return 1;
    }
    
    output("Mouse tracker started\n");
    
    mouseHook = SetWindowsHookEx(WH_MOUSE_LL, MouseProc, GetModuleHandle(NULL), 0);
    
    if (!mouseHook) {
        output("Failed to create mouse hook\n");
        return 1;
    }
    
    output("Hook installed\n");
    
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    UnhookWindowsHookEx(mouseHook);
    DeleteCriticalSection(&cs);
    return 0;
}
