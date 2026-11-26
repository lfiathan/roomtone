#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
static void spin(double t){[[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:t]];}
int main(int argc, const char *argv[]) { @autoreleasepool {
  if(argc<4) return 1;
  [NSApplication sharedApplication];
  CGFloat width=atof(argv[3]), height=990;
  WebView *view=[[WebView alloc] initWithFrame:NSMakeRect(0,0,width,height) frameName:nil groupName:nil];
  NSURL *url=[NSURL fileURLWithPath:[[NSString stringWithUTF8String:argv[1]] stringByStandardizingPath]];
  [[view preferences] setJavaScriptEnabled:YES];
  NSString *html=[NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil];
  [[view mainFrame] loadHTMLString:html baseURL:[url URLByDeletingLastPathComponent]];
  for(int i=0;i<120;i++){spin(0.025);if([view stringByEvaluatingJavaScriptFromString:@"document.querySelector('h1')?.textContent"].length) break;}
  if(argc>4){NSString *js=[NSString stringWithContentsOfFile:[NSString stringWithUTF8String:argv[4]] encoding:NSUTF8StringEncoding error:nil];NSLog(@"QA %@",[view stringByEvaluatingJavaScriptFromString:js]);spin(0.08);}
  NSLog(@"Page %@",[view stringByEvaluatingJavaScriptFromString:@"document.title + ' | ' + document.querySelector('h1')?.textContent"]);
  NSBitmapImageRep *rep=[view bitmapImageRepForCachingDisplayInRect:view.bounds];[view cacheDisplayInRect:view.bounds toBitmapImageRep:rep];
  [[rep representationUsingType:NSBitmapImageFileTypePNG properties:@{}] writeToFile:[NSString stringWithUTF8String:argv[2]] atomically:YES];
  return [view stringByEvaluatingJavaScriptFromString:@"document.querySelector('h1')?.textContent"].length ? 0:2;
}}
