import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ScriptLoadService {
  constructor() {}

  loadScript(url: string, id: string, c: Function): void {
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;
      script.id = id;
      script.addEventListener(
        "load",
        e => {
          c(null, e);
        },
        false
      );
      document.head.appendChild(script);
    }
  }
}
