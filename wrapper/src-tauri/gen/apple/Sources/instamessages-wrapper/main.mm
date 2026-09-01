#import <Foundation/Foundation.h>
#import <objc/message.h>
#include "bindings/bindings.h"

int main(int argc, char * argv[]) {
	// Background App Refresh (Sep 1): BGTaskScheduler wants its handlers
	// registered before the app finishes launching, and Tauri owns the
	// app delegate, so the registration happens here, before
	// UIApplicationMain. Looked up by name like the bridge itself.
	Class store = NSClassFromString(@"KonvoStore");
	SEL reg = NSSelectorFromString(@"registerBackgroundRefresh");
	if (store && [store respondsToSelector:reg]) {
		((void (*)(id, SEL))objc_msgSend)(store, reg);
	}
	ffi::start_app();
	return 0;
}
