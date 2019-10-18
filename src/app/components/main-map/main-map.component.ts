/// <reference types="@types/markerclustererplus" />

import { Component, OnInit, ElementRef, AfterViewInit } from "@angular/core";
import { ViewChild } from "@angular/core";
import {} from "google-maps";

import { ScriptLoadService } from "src/app/services/script-load.service";
import { DataService } from "src/app/services/data.service";

import { styledMap } from "src/app/objects/styledMap";
import { customGradient } from "src/app/objects/gradient";
import { mapNumber } from "src/app/functions/mapNumber";

const your_API_key = "AIzaSyBvoXsT-nJZYZnAHcBt2ryxwcTX1dPzGkY";
const url = `https://maps.googleapis.com/maps/api/js?key=${your_API_key}&libraries=geometry,visualization`;

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
  heatmap: google.maps.visualization.HeatmapLayer;

  lettings: string[][];
  masts: string[][];
  markers: google.maps.Marker[] = [];

  showLonely: boolean = false;
  clust_num: number;
  prevalence: string;

  dark_theme: boolean = true;
  mastsVisible: boolean = false;
  clustersVisible: boolean = false;
  heatmapVisible: boolean = false;

  heatmap_radius: number = 20;

  @ViewChild("mapElement", { static: false }) mapElm: ElementRef;
  @ViewChild("legend", { static: false }) legend: ElementRef;
  @ViewChild("controls", { static: false }) controls: ElementRef;
  @ViewChild("drawingControls", { static: false }) drawingControls: ElementRef;

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

    this.map.controls[this.maps.ControlPosition.LEFT_TOP].push(
      this.controls.nativeElement
    );
    this.map.controls[this.maps.ControlPosition.LEFT_BOTTOM].push(
      this.legend.nativeElement
    );

    this.map.controls[this.maps.ControlPosition.TOP_RIGHT].push(
      this.drawingControls.nativeElement
    );

    this.loadAllMarkers(this.map);
    this.loadGeoJson(this.map);
    this.loadHeatmapData(this.map);
  }

  loadHeatmapData(map: google.maps.Map) {
    this.data
      .loadAsset("assets/data/letting.json")
      .then((data: { meta: {}; data: string[][] }) => {
        this.lettings = data.data;
        const heatmapData = [];
        this.lettings.map((x: string[]) => {
          heatmapData.push({
            location: new this.maps.LatLng(x[24], x[23]),
            weight: parseInt(x[15], 10)
          });
        });
        this.heatmap = new this.maps.visualization.HeatmapLayer({
          data: heatmapData
        });
        this.heatmap.set("gradient", customGradient);
        this.heatmap.set("radius", 70);
        this.heatmap.set("opacity", 1);
        // heatmap.setMap(map);
      });
  }

  loadGeoJson(map: google.maps.Map) {
    map.data.loadGeoJson("assets/data/lonely.geojson");
    map.data.addListener("mouseover", e => {
      this.showLonely = true;
      this.prevalence = e.feature.getProperty("PREVALENCE");
    });

    map.data.addListener("mouseout", e => {
      this.showLonely = false;
    });
    map.data.setStyle(feature => {
      const lon = feature.getProperty("PREVALENCE");
      const value = 255 - Math.round(mapNumber(lon, 0, 5, 0, 255));
      const color = "rgb(" + value + "," + value + "," + 0 + ")";
      return {
        fillColor: color,
        strokeWeight: 1
      };
    });

    this.infoWindow = new this.maps.InfoWindow();
    map.data.addListener("click", e => {
      this.infoWindow.setPosition(e.latLng);
      this.infoWindow.setContent(`<div class="overlay">
      <p><b>Prevalence factor of Loneliness of those over the age of 65: </b>
        ${e.feature.getProperty("PREVALENCE")}</p></div>`);
      this.infoWindow.open(map);
    });
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
          marker.addListener("click", e => {
            this.infoWindow.setPosition(e.latLng);
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

  toggleMasts(): void {
    console.log(this.mastsVisible);
    if (!this.mastsVisible) {
      this.markers.map(marker => {
        marker.setMap(this.map);
      });
    } else {
      this.markers.map(marker => {
        marker.setMap(null);
      });
    }
    this.mastsVisible = !this.mastsVisible;
  }

  toggleClusters(): void {
    if (!this.clustersVisible) {
      this.markerClusterer = new MarkerClusterer(this.map, this.markers, {
        imagePath: "assets/img/m"
      });
      this.markerClusterer.setGridSize(10);
    } else {
      this.markerClusterer.clearMarkers();
    }
    this.clustersVisible = !this.clustersVisible;
  }

  toggleHeatmap(): void {
    if (this.heatmapVisible) {
      this.heatmap.setMap(null);
    } else {
      this.heatmap.setMap(this.map);
    }
    this.heatmapVisible = !this.heatmapVisible;
  }

  changeCluster(): void {
    this.clustersVisible = true;
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }
    this.markerClusterer = new MarkerClusterer(this.map, this.markers, {
      imagePath: "assets/img/m"
    });
    this.markerClusterer.setGridSize(this.clust_num);
  }

  changed() {
    this.heatmap.set("radius", this.heatmap_radius);
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

  changeType() {
    if (!this.dark_theme) {
      this.map.setMapTypeId("dark_map");
    } else {
      this.map.setMapTypeId("roadmap");
    }
    this.dark_theme = !this.dark_theme;
  }
}
