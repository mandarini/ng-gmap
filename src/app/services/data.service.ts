import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class DataService {
  constructor(private http: HttpClient) {}

  loadAsset(url: string): Promise<{}> {
    console.log("called");
    return this.http.get(url).toPromise();
  }
}
