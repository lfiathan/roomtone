#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
static void spin(double t){[[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:t]];}
int main(int argc,const char *argv[]){@autoreleasepool{
 if(argc<5)return 2;
 [NSApplication sharedApplication];
 WebView *view=[[WebView alloc] initWithFrame:NSMakeRect(0,0,atof(argv[3]),1000) frameName:nil groupName:nil];
 NSURL *url=[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
 [[view preferences] setJavaScriptEnabled:YES];
 NSString *html=[NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil];[[view mainFrame] loadHTMLString:html baseURL:[url URLByDeletingLastPathComponent]];
 for(int i=0;i<200;i++){spin(.02);if([view stringByEvaluatingJavaScriptFromString:@"document.querySelector('h1')?.textContent"].length)break;}
 NSString *js=[NSString stringWithContentsOfFile:[NSString stringWithUTF8String:argv[4]] encoding:NSUTF8StringEncoding error:nil];
 [view stringByEvaluatingJavaScriptFromString:js];
 NSString *result=nil;
 for(int i=0;i<1200;i++){spin(.025);result=[view stringByEvaluatingJavaScriptFromString:@"window.qaResult || ''"];if(result.length)break;}
 NSLog(@"%@",result);
 NSBitmapImageRep *rep=[view bitmapImageRepForCachingDisplayInRect:view.bounds];[view cacheDisplayInRect:view.bounds toBitmapImageRep:rep];
 [[rep representationUsingType:NSBitmapImageFileTypePNG properties:@{}] writeToFile:[NSString stringWithUTF8String:argv[2]] atomically:YES];
 return [result hasPrefix:@"PASS"]?0:1;
}}
