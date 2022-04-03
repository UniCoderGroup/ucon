import "./styles.css";
import React from "react";
import AppCode from "./images/AppCode.png";
import AppOpt from "./images/AppOpt.png";
import IconUCon from "./images/icons/ucon.svg";
import IconUTty from "./images/icons/utty.svg";
import IconUTtyNode from "./images/icons/utty-node.svg";
import IconUTtyReact from "./images/icons/utty-react.svg";
import IconUTtyVue from "./images/icons/utty-vue.svg";

class Icon extends React.Component<{
  icon: string;
  x: number;
  y: number;
  scale?: number;
}> {
  render() {
    let scale = this.props.scale ?? 1;
    return (
      <div
        style={{
          position: "relative",
          left: this.props.x,
          top: this.props.y,
          transform: `scale(${scale},${scale})`,
          transformOrigin: "left top",
        }}
      >
        {this.props.icon === "" ? <></> : <img src={this.props.icon} />}
      </div>
    );
  }
}

class Shield extends React.Component<{
  alt: string;
  path: string;
  link?: string;
}> {
  render() {
    if (this.props.link) {
      return (
        <a href={this.props.link}>
          <img
            alt={this.props.alt}
            src={"https://img.shields.io/" + this.props.path}
          />
        </a>
      );
    } else {
      return (
        <img
          alt={this.props.alt}
          src={"https://img.shields.io/" + this.props.path}
        />
      );
    }
  }
}
type Status =
  | "Active"
  | "Developing"
  | "EOL"
  | "Deprecated"
  | "Designing"
  | "N/A";
type ShieldsColors =
  | "default-colors"
  | "brightgreen"
  | "green"
  | "yellowgreen"
  | "yellow"
  | "orange"
  | "red"
  | "lightgrey"
  | "blue";
const StatusColor = new Map<Status, ShieldsColors>([
  ["Active", "green"],
  ["Developing", "brightgreen"],
  ["EOL", "red"],
  ["Deprecated", "lightgrey"],
  ["Designing", "yellow"],
  ["N/A", "lightgrey"],
]);
class StatusImg extends React.Component<{ status: Status }> {
  render() {
    return (
      <div
        style={
          this.props.status === "Developing" ||
          this.props.status === "Designing" ||
          this.props.status === "Deprecated"
            ? { transform: "scale(0.9,0.9)", transformOrigin: "left" }
            : {}
        }
      >
        <Shield
          alt="status"
          path={
            "badge/status-" +
            this.props.status +
            "-" +
            StatusColor.get(this.props.status)
          }
        />
      </div>
    );
  }
}
class VersionImg extends React.Component<{ name: string; isNA?: boolean }> {
  render() {
    if (this.props.isNA) {
      return <Shield alt="version" path={"badge/version-N/A-lightgrey"} />;
    }
    return (
      <Shield
        alt="version"
        path={"npm/v/" + this.props.name.toLowerCase() + "?label=version"}
      />
    );
  }
}
class Link extends React.Component<{
  href?: string;
  disable?: boolean;
  style?: React.CSSProperties;
}> {
  render() {
    if (this.props.disable) return this.props.children;
    return (
      <a
        style={{ color: "unset", textDecoration: "unset", ...this.props.style }}
        href={this.props.href}
      >
        {this.props.children}
      </a>
    );
  }
}
class Pkg extends React.Component<{
  name: string;
  status: Status;
  desc: string;
  x: number;
  y: number;
  scale?: number;
  disableLink?: boolean;
  icon?: string;
}> {
  render() {
    let scale = this.props.scale ?? 1;
    return (
      <div
        style={{
          position: "absolute",
          border: "1px black solid",
          borderRadius: "5px",
          padding: "2px",
          width: 100,
          height: 150,
          left: this.props.x,
          top: this.props.y,
          transform: `scale(${scale},${scale})`,
        }}
      >
        <Link
          href={`https://www.github.com/UniCoderGroup/${this.props.name}`}
          disable={this.props.disableLink}
        >
          <div
            style={{
              backgroundColor: "#AAAAAA",
              borderRadius: "5px",
              height: "25px",
              position: "relative",
            }}
          >
            {this.props.icon === undefined ? (
              <></>
            ) : (
              <div
                style={{
                  backgroundColor: "#DDDDDD",
                  borderRadius: "5px",
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "25px",
                  height: "25px",
                }}
              >
                <Icon icon={this.props.icon ?? ""} x={0} y={0} scale={0.04} />
              </div>
            )}
            <div
              style={{
                fontSize: 15,
                textAlign: "center",
                marginLeft: this.props.icon === undefined ? "unset" : "21px",
              }}
            >
              {this.props.name}
            </div>
          </div>
        </Link>
        <div
          style={{
            fontSize: 13,
          }}
        >
          {this.props.desc}
        </div>
        <div style={{ position: "absolute", bottom: 0, lineHeight: "2px" }}>
          <StatusImg status={this.props.status} />
          <VersionImg
            isNA={this.props.status !== "Active"}
            name={this.props.name}
          />
        </div>
        <div>{this.props.children}</div>
      </div>
    );
  }
}
class Part extends React.Component<{
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  render() {
    return (
      <div
        style={{
          position: "absolute",
          width: this.props.width,
          height: this.props.height,
          textAlign: "center",
          left: this.props.x,
          top: this.props.y,
          border: "1px black solid",
          borderRadius: "4px",
          lineHeight: this.props.height + "px",
        }}
      >
        <div
          style={{
            lineHeight: "initial",
            verticalAlign: "middle",
            display: "inline-block",
          }}
        >
          {this.props.name}
        </div>
      </div>
    );
  }
}
class PartV extends React.Component<{
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  render() {
    return (
      <div
        style={{
          position: "absolute",
          width: this.props.width,
          height: this.props.height,
          textAlign: "center",
          left: this.props.x,
          top: this.props.y,
          border: "1px black solid",
          borderRadius: "4px",
          writingMode: "vertical-rl",
          lineHeight: this.props.width + "px",
        }}
      >
        <div
          style={{
            lineHeight: "initial",
            verticalAlign: "middle",
            display: "inline-block",
          }}
        >
          {this.props.name}
        </div>
      </div>
    );
  }
}
class Line extends React.Component<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  str?: string;
}> {
  render() {
    let w = this.props.x2 - this.props.x1,
      h = this.props.y2 - this.props.y1,
      x = this.props.x1,
      y = this.props.y1;
    return (
      <>
        <path
          d={`M${x} ${y} C ${x + 50} ${y}, ${x + w - 50} ${y + h}, ${x + w} ${
            y + h
          }`}
          style={{
            fill: "none",
            stroke: "black",
            strokeWidth: 2,
            markerEnd: "url(#markerArrow)",
          }}
        />
        <text
          text-anchor="middle"
          x={x + w / 2}
          y={y + h / 2 - 10}
          fill="#555555"
        >
          {this.props.str}
        </text>
      </>
    );
  }
}
class LineV extends React.Component<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  str?: string;
}> {
  render() {
    let w = this.props.x2 - this.props.x1,
      h = this.props.y2 - this.props.y1,
      x = this.props.x1,
      y = this.props.y1;
    return (
      <>
        <path
          d={`M${x} ${y} C ${x + 15} ${y}, ${x + w} ${y + h + 35}, ${x + w} ${
            y + h
          }`}
          style={{
            fill: "none",
            stroke: "black",
            strokeWidth: 2,
            markerEnd: "url(#markerArrow)",
          }}
        />
        <text text-anchor="left" x={x + w / 2 + 7} y={y + h / 2} fill="#555555">
          {this.props.str}
        </text>
      </>
    );
  }
}
class LineX extends React.Component<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  str?: string;
}> {
  render() {
    let w = this.props.x2 - this.props.x1,
      h = this.props.y2 - this.props.y1,
      x = this.props.x1,
      y = this.props.y1;
    return (
      <>
        <path
          d={`M${x} ${y} C ${x + 50} ${y}, ${x + w - 50} ${y + h}, ${x + w} ${
            y + h
          }`}
          style={{
            fill: "none",
            stroke: "black",
            strokeWidth: 2,
            markerEnd: "url(#markerArrow)",
            strokeDasharray: "3 2",
          }}
        />
        <text
          text-anchor="middle"
          x={x + w / 2 - 10}
          y={y + h / 2 + 17}
          fill="#111111"
        >
          {this.props.str}
        </text>
      </>
    );
  }
}
export default function App() {
  return (
    <div
      className="App"
      style={{
        position: "absolute",
        width: "1550px",
        height: "640px",
      }}
    >
      <h1>UCON Roadmap</h1>
      v1.0.2
      <div
        style={{
          position: "relative",
          border: "grey 1px solid",
          width: "90%",
          height: "90%",
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <marker
              id="markerArrow"
              markerWidth="13"
              markerHeight="13"
              refX="2"
              refY="6"
              orient="auto"
            >
              <path d="M0,0 L2,11 L10,6 L2,2" style={{ fill: "#000000" }} />
            </marker>
          </defs>
          <Line x1={306} y1={110} x2={445} y2={130} str="supports" />
          <LineV x1={180} y1={286} x2={250} y2={220} />
          <LineV x1={270} y1={286} x2={250} y2={220} />
          <LineV x1={340} y1={286} x2={250} y2={220} str="implements" />
          <LineV x1={166} y1={500} x2={180} y2={425} str="supports" />
          <LineV x1={570} y1={276} x2={620} y2={200} str="implements" />
          <LineX x1={760} y1={60} x2={980} y2={200} />
          <LineX x1={760} y1={130} x2={980} y2={200} str="develops" />
          <LineX x1={680} y1={300} x2={980} y2={200} />
          <rect
            x={468}
            y={278}
            width={211}
            height={200}
            style={{
              strokeWidth: "1px",
              stroke: "black",
              fill: "transparent",
              strokeDasharray: "3 2",
            }}
          />
        </svg>
        <Pkg
          name="utty"
          status="Active"
          desc="A declaration of tty that supports UCon."
          icon={IconUTty}
          x={200}
          y={50}
        />
        <Pkg
          name="nodeliketty"
          status="Active"
          desc="A declaration of tty that works like nodejs WriteStream."
          x={70}
          y={420}
          scale={0.8}
        />
        <Pkg
          name="utty-node"
          status="Active"
          desc="An implement of utty for nodejs WriteStream."
          icon={IconUTtyNode}
          x={130}
          y={270}
          scale={0.8}
        />
        <Pkg
          name="utty-react"
          status="Designing"
          desc="An implement of utty for Reactjs."
          icon={IconUTtyReact}
          x={220}
          y={270}
          scale={0.8}
        />
        <Pkg
          name="utty-vue"
          status="Designing"
          desc="An implement of utty for Vuejs."
          icon={IconUTtyVue}
          x={310}
          y={270}
          scale={0.8}
        />
        <Pkg
          name="ucon"
          status="Developing"
          desc="The implement of UCon, with standard components."
          icon={IconUCon}
          x={460}
          y={30}
        />
        <PartV name="Components" x={569} y={84} width={25} height={100} />
        <Part name="Inline" x={597} y={84} width={80} height={30} />
        <Part name="Block" x={597} y={119} width={80} height={30} />
        <Part name="Container" x={597} y={154} width={80} height={30} />
        <Part name="UCon" x={569} y={30} width={189} height={50} />
        <PartV
          name="Standard Components"
          x={680}
          y={84}
          width={78}
          height={100}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={450}
          y={250}
          scale={0.6}
          disableLink={true}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={520}
          y={250}
          scale={0.6}
          disableLink={true}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={590}
          y={250}
          scale={0.6}
          disableLink={true}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={450}
          y={350}
          scale={0.6}
          disableLink={true}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={520}
          y={350}
          scale={0.6}
          disableLink={true}
        />
        <Pkg
          name="3rd-party"
          status="N/A"
          desc="Third-party UCon components from our community."
          x={590}
          y={350}
          scale={0.6}
          disableLink={true}
        />
        <div
          style={{
            position: "absolute",
            border: "1px black solid",
            borderRadius: "5px",
            padding: "2px",
            left: 994,
            top: 100,
            width: 366,
            height: 334,
          }}
        >
          <div
            style={{
              backgroundColor: "#AAAAAA",
              borderRadius: "5px",
              fontSize: 15,
              textAlign: "center",
              lineHeight: "30px",
            }}
          >
            Application
            <br />
            based on UCon project
          </div>
          <img
            src={AppCode}
            style={{
              marginTop: "3px",
              transformOrigin: "left top",
              transform: "scale(0.7,0.7)",
              borderRadius: "5px",
              border: "3px solid #aaaaaa",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "205px",
            }}
          >
            Example Output:
          </div>
          <img
            src={AppOpt}
            style={{
              marginTop: "3px",
              transformOrigin: "left top",
              transform: "scale(0.424,0.424)",
              borderRadius: "10px",
              border: "4px solid #aaaaaa",
              position: "relative",
              top: "-25px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
