/// <reference types="@types/markerclustererplus" />

import { Component, OnInit, ElementRef, AfterViewInit } from "@angular/core";
import { ViewChild } from "@angular/core";
import {} from "google-maps";

import { ScriptLoadService } from "src/app/services/script-load.service";
import { DataService } from "src/app/services/data.service";

import { styledMap } from "src/app/objects/styledMap";
import { customGradient } from "src/app/objects/gradient";

const your_API_key = "AIzaSyBvoXsT-nJZYZnAHcBt2ryxwcTX1dPzGkY";
const url = `https://maps.googleapis.com/maps/api/js?key=${your_API_key}&libraries=geometry`;

@Component({
  selector: "my-main-map",
  templateUrl: "./main-map.component.html",
  styleUrls: ["./main-map.component.scss"]
})
export class MainMapComponent implements OnInit, AfterViewInit {
  maps: any;
  map: google.maps.Map;
  london: google.maps.LatLng;
  infoWindow: google.maps.InfoWindow;
  markerClusterer: MarkerClusterer;

  lettings: string[];
  masts: string[][];
  markers: google.maps.Marker[] = [];

  @ViewChild("mapElement", { static: false }) mapElm: ElementRef;

  constructor(private load: ScriptLoadService, private data: DataService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    if (window["google"] && window["google"]["maps"]) {
      this.maps = window["google"]["maps"];
      this.firstLoad(this.maps);
    } else {
      this.load.loadScript(url, "gmap", () => {
        this.maps = window["google"]["maps"];
        this.firstLoad(this.maps);
      });
    }
  }

  firstLoad(maps: any): void {
    this.london = this.coords(51.561638, -0.14);

    const darkmap = new this.maps.StyledMapType(styledMap, {
      name: "Dark Map"
    });

    this.map = new maps.Map(this.mapElm.nativeElement, {
      zoom: 10,
      center: this.london,
      scrollwheel: true,
      panControl: false,
      mapTypeControl: false,
      zoomControl: true,
      streetViewControl: false,
      scaleControl: true,
      zoomControlOptions: {
        style: this.maps.ZoomControlStyle.LARGE,
        position: this.maps.ControlPosition.RIGHT_BOTTOM
      }
    });

    this.map.mapTypes.set("dark_map", darkmap);
    this.map.setMapTypeId("dark_map");

    const locControl = document.getElementById("location-buttons");
    this.map.controls[this.maps.ControlPosition.TOP_CENTER].push(locControl);

    this.loadAllMarkers(this.map);
  }

  loadAllMarkers(map: google.maps.Map): void {
    const antenna = new this.maps.MarkerImage(
      "assets/img/antennabl.png",
      null,
      null,
      null,
      new this.maps.Size(25, 40)
    );
    this.data
      .loadAsset("assets/data/masts.json")
      .then((masts: { meta: {}; data: string[][] }) => {
        this.masts = masts.data;

        this.masts.map((x: string[]) => {
          let marker = new this.maps.Marker({
            position: new this.maps.LatLng(x[18], x[17]),
            icon: antenna
          });
          this.infoWindow = new this.maps.InfoWindow();
          marker.addListener("click", () => {
            this.infoWindow.setContent(marker.getTitle());
            this.infoWindow.open(map, marker);
          });
          this.markers.push(marker);
        });
      })
      .catch(error => {
        console.log(error, "Error loading asset");
      });
  }

  showMasts(show: boolean) {
    if (show) {
      this.markers.map(marker => {
        marker.setMap(this.map);
      });
    } else {
      this.markers.map(marker => {
        marker.setMap(null);
      });
    }
  }

  cluster(bool: boolean, cluster: number) {
    if (bool) {
      this.markerClusterer = new MarkerClusterer(this.map, this.markers, {
        imagePath: "assets/img/m"
      });
      this.markerClusterer.setGridSize(cluster);
    } else {
      this.markerClusterer.clearMarkers();
    }
  }

  changeCluster(value: string) {
    this.markerClusterer.clearMarkers();
    this.cluster(true, parseInt(value, 10));
  }

  coords(x: number, y: number) {
    return new this.maps.LatLng(x, y);
  }

  city(city: string) {
    if (city === "lon") {
      this.map.setCenter(this.coords(51.561638, -0.14));
    }
    if (city === "man") {
      this.map.setCenter(this.coords(53.52476717517185, -2.5434842249308414));
    }
  }

  changeType(type: string) {
    if (type === "dark") {
      this.map.setMapTypeId("dark_map");
    } else {
      this.map.setMapTypeId("roadmap");
    }
  }
}
