import { Component } from "./component";
export class Unit {
  constructor(component: Component) {
    this.component = component;
  }
  component: Component;
}
