import { Webview } from "webview-bun";
const ww = new Webview();

ww.navigate("http://localhost:3000/");
ww.title = "Nyx";
ww.run();
