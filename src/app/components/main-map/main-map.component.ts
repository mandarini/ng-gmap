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
const url = `https://maps.googleapis.com/maps/api/js?key=${your_API_key}&libraries=geometry,visualization,drawing`;

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
  drawingManager: google.maps.drawing.DrawingManager;
  allOverlays: any[] = [];

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

  viewReady: boolean = false;

  @ViewChild("mapElement", { static: false }) mapElm: ElementRef;
  @ViewChild("legend", { static: false }) legend: ElementRef;
  @ViewChild("controls", { static: false }) controls: ElementRef;
  @ViewChild("drawingControls", { static: false }) drawingControls: ElementRef;

  constructor(private load: ScriptLoadService, private data: DataService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    if (window["google"] && window["google"]["maps"]) {
      this.firstLoad();
    } else {
      this.load.loadScript(url, "gmap", () => {
        this.firstLoad();
      });
    }
  }

  firstLoad(): void {
    this.london = this.coords(51.561638, -0.14);

    const darkmap = new google.maps.StyledMapType(
      styledMap as google.maps.MapTypeStyle[],
      {
        name: "Dark Map"
      }
    );

    this.map = new google.maps.Map(this.mapElm.nativeElement, {
      zoom: 10,
      center: this.london,
      scrollwheel: true,
      panControl: false,
      mapTypeControl: false,
      zoomControl: true,
      streetViewControl: false,
      scaleControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
    });

    this.viewReady = true;

    this.map.mapTypes.set("dark_map", darkmap);
    this.map.setMapTypeId("dark_map");

    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(
      this.controls.nativeElement
    );
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(
      this.legend.nativeElement
    );

    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
      this.drawingControls.nativeElement
    );

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false // i have my custom tools so i don't need the defaults to be displayed
    });
    this.drawingManager.setMap(this.map);

    this.listenForDrawing(this.map, this.drawingManager);

    this.loadAllMarkers(this.map);
    this.loadGeoJson(this.map);
    this.loadHeatmapData();
  }

  loadHeatmapData() {
    this.data
      .loadAsset("assets/data/letting.json")
      .then((data: { meta: {}; data: string[][] }) => {
        this.lettings = data.data;
        const heatmapData = [];
        this.lettings.map((x: string[]) => {
          heatmapData.push({
            location: new google.maps.LatLng(
              parseFloat(x[24]),
              parseFloat(x[23])
            ),
            weight: parseInt(x[15], 10)
          });
        });
        this.heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData
        });
        this.heatmap.set("gradient", customGradient);
        this.heatmap.set("radius", 70);
        this.heatmap.set("opacity", 1);
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

    this.infoWindow = new google.maps.InfoWindow();
    map.data.addListener("click", e => {
      this.infoWindow.setPosition(e.latLng);
      this.infoWindow.setContent(`<div class="overlay">
      <p><b>Prevalence factor of Loneliness of those over the age of 65: </b>
        ${e.feature.getProperty("PREVALENCE")}</p></div>`);
      this.infoWindow.open(map);
    });
  }

  loadAllMarkers(map: google.maps.Map): void {
    const antenna: google.maps.Icon = {
      url: "assets/img/antennabl.png",
      scaledSize: new google.maps.Size(40, 40)
    };
    this.data
      .loadAsset("assets/data/masts.json")
      .then((masts: { meta: {}; data: string[][] }) => {
        this.masts = masts.data;
        this.masts.map((x: string[]) => {
          let marker = new google.maps.Marker({
            position: new google.maps.LatLng(
              parseFloat(x[18]),
              parseFloat(x[17])
            ),
            icon: antenna
          });
          this.infoWindow = new google.maps.InfoWindow();
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
    return new google.maps.LatLng(x, y);
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

  listenForDrawing(
    map: google.maps.Map,
    drawingManager: google.maps.drawing.DrawingManager
  ) {
    google.maps.event.addListener(drawingManager, "overlaycomplete", event => {
      this.allOverlays.push(event.overlay);
      event.overlay.addListener("rightclick", () => {
        event.overlay.setMap(null);
      });
      switch (event.type) {
        case "polygon":
          map.data.add(
            new google.maps.Data.Feature({
              geometry: new google.maps.Data.Polygon([
                event.overlay.getPath().getArray()
              ])
            })
          );
          break;
        case "rectangle":
          let bounds = event.overlay.getBounds();
          let points = [
            bounds.getSouthWest(),
            {
              lat: bounds.getSouthWest().lat(),
              lng: bounds.getNorthEast().lng()
            },
            bounds.getNorthEast(),
            {
              lng: bounds.getSouthWest().lng(),
              lat: bounds.getNorthEast().lat()
            }
          ];
          map.data.add(
            new google.maps.Data.Feature({
              geometry: new google.maps.Data.Polygon([points])
            })
          );
          break;
        case "polyline":
          map.data.add(
            new google.maps.Data.Feature({
              geometry: new google.maps.Data.LineString(
                event.overlay.getPath().getArray()
              )
            })
          );
          break;
        case "circle":
          map.data.add(
            new google.maps.Data.Feature({
              properties: {
                radius: event.overlay.getRadius()
              },
              geometry: new google.maps.Data.Point(event.overlay.getCenter())
            })
          );
          break;
        default:
          console.log("end");
      }
    });
  }

  draw(type: string) {
    switch (type) {
      case "marker":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.MARKER
        );
        const point: google.maps.Icon = {
          url: "assets/img/point.png",
          scaledSize: new google.maps.Size(30, 30)
        };

        this.drawingManager.setOptions({
          markerOptions: {
            icon: point,
            clickable: true,
            draggable: true
          }
        });
        break;
      case "cat":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.MARKER
        );
        const cat: google.maps.Icon = {
          url: "assets/img/cat.png",
          scaledSize: new google.maps.Size(70, 70)
        };
        this.drawingManager.setOptions({
          markerOptions: {
            icon: cat,
            clickable: true,
            draggable: true
          }
        });
        break;
      case "polygon":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.POLYGON
        );
        this.drawingManager.setOptions({
          polygonOptions: {
            fillColor: "#9c4d4f",
            fillOpacity: 0.5,
            strokeWeight: 2,
            strokeColor: "#401619",
            clickable: true,
            editable: true,
            draggable: true
          }
        });
        break;
      case "square":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.RECTANGLE
        );
        this.drawingManager.setOptions({
          rectangleOptions: {
            fillColor: "#fff82e",
            fillOpacity: 0.5,
            strokeWeight: 2,
            strokeColor: "#c8a535",
            clickable: true,
            editable: true,
            draggable: true
          }
        });
        break;
      case "polyline":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.POLYLINE
        );
        this.drawingManager.setOptions({
          polylineOptions: {
            strokeWeight: 2,
            strokeColor: "#00b801",
            clickable: true,
            editable: true,
            draggable: true
          }
        });
        break;
      case "circle":
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.CIRCLE
        );
        this.drawingManager.setOptions({
          circleOptions: {
            fillColor: "#00b801",
            fillOpacity: 0.5,
            strokeWeight: 2,
            strokeColor: "#00b801",
            clickable: true,
            editable: true,
            draggable: true
          }
        });
        break;
      case "pan":
        this.drawingManager.setDrawingMode(null);
        break;
      case "save":
        this.drawingManager.setDrawingMode(null);
        this.map.data.toGeoJson(obj => {
          console.log(JSON.stringify(obj));
          console.log(obj);
        });
        break;
      default:
        this.drawingManager.setDrawingMode(null);
    }
  }

  clearAll() {
    this.allOverlays.map(overlay => {
      overlay.setMap(null);
    });
    this.allOverlays = [];
  }
}
