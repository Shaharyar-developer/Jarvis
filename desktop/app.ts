import { Webview } from "webview-bun";
const ww = new Webview();

ww.navigate("http://localhost:5173/");
ww.title = "Nyx";
ww.run();
