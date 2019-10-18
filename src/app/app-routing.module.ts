import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MainMapComponent } from "./components/main-map/main-map.component";

const routes: Routes = [
  {
    path: "home",
    component: MainMapComponent
  },
  { path: "", redirectTo: "/home", pathMatch: "full" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
