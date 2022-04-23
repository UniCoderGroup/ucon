import { BlockComponent } from "ucon";
import _ from "lodash";
import { align, AlignDirection } from "./Align.js";

///// Table ////////////////////////////////////////////////
export interface TableProps<T> {
  separator: boolean;
  title: string;
  cols: {
    title: string;
    width: number;
    align: AlignDirection;
    key: keyof T;
  }[];
}
/**
 * Table: A standard BlockComponent.
 * Shows a table in the screen.
 */
export class Table<T> extends BlockComponent<TableProps<T>> {
  defaultProps: TableProps<T> = {
    separator: true,
    title: "",
    cols: [],
  };
  // static charTable: {
  //   borders: [
  //     ["\u250F", "\u2501", "\u2513"],
  //     ["\u2503", "", "\u2503"],
  //     ["\u2517", "\u2501", "\u251B"]
  //   ],
  //   linkers:[
  //   ]
  // };
  datas: T[] = [];
  addData(...datas: T[]): void {
    this.datas.concat(datas);
  }
  render(): string[] {
    const titleLine = () => {
      return ".----- " + this.props.title + " -----.";
    };
    const separateLine = () => {
      return this.props.separator
        ? [
            "+" +
              this.props.cols
                .map((col) => {
                  return "-".repeat(col.width) + "+";
                })
                .join(""),
          ]
        : [];
    };
    const headerLine = () => {
      return [
        "|" +
          this.props.cols
            .map((col) => {
              return align(col.align, col.width, col.title).render() + "|";
            })
            .join(""),
      ];
    };
    const dataLine = (data: T) => {
      return [
        "|" +
          this.props.cols
            .map((col) => {
              let str = _.toString(data[col.key]);
              return align(col.align, col.width, str as string).render() + "|";
            })
            .join(""),
      ];
    };
    const datasLines = () => {
      let result: string[] = [];
      this.datas.forEach((data) => {
        result = result.concat(dataLine(data));
      });
      return result;
    };
    return new Array<string>().concat(
      titleLine(),
      separateLine(),
      headerLine(),
      separateLine(),
      datasLines(),
      separateLine()
    );
  }
}
////////////////////////////////////////////////////////////
