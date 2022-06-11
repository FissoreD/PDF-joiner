import React, { Component, ReactNode } from "react";
import { GridContextProvider, GridDropZone, GridItem, swap } from "react-grid-dnd";
import ReactTooltip from "react-tooltip";
import { Header } from "./HeaderComponent";
import { PDF } from "./PDFComponent";


export class MyBody extends Component<{}, { pdfList: PDF[], header: Header, items: { id: number, n: string }[] }> {
  pdfList: PDF[];

  constructor(props: string) {
    super(props);
    this.pdfList = [];
    this.state = {
      pdfList: this.pdfList,
      header: new Header(this),
      items: [{ id: 1, n: "aa" }]
    }
  }

  async setPdfList(inp: { add?: PDF, remove?: PDF }) {
    let pdfList = this.state.pdfList
    if (inp.add) {
      pdfList.push(inp.add)
      this.setState({ pdfList })
    }
    if (inp.remove) {
      let index = pdfList.indexOf(inp.remove)
      if (index >= 0) {
        pdfList.splice(index, 1)
        this.setState({ pdfList })
      }
    }
  }

  pdfIndex(pdf: PDF) {
    return this.state.pdfList.indexOf(pdf)
  }

  render(): ReactNode {
    let onChange = (_sourceId: string, sourceIndex: number, targetIndex: number, _targetId?: string | undefined) => {
      const nextState = swap(this.state.pdfList, sourceIndex, targetIndex);
      this.setState({ pdfList: nextState });
    }

    window.onkeydown = (evt) => {
      let newIt = this.state.items;
      newIt.push({ id: this.state.items.length + 1, n: "aa" })
      this.setState({ items: newIt })
    }

    return (
      <>
        {this.state.header.render()}
        <div className="App">
          <GridContextProvider onChange={onChange}>
            <GridDropZone
              id="items"
              boxesPerRow={3}
              rowHeight={230}
              style={{ height: `${230 * (Math.floor(this.state.pdfList.length / 3) + 1)}px`, width: "800px", margin: "auto" }}
            >
              {this.state.pdfList.map((item) => (
                <GridItem key={item.id}>
                  <div className="grid-item">
                    {item.render()}
                  </div>
                </GridItem>
              ))}
              <ReactTooltip />
            </GridDropZone>
          </GridContextProvider>
          {/* <ReactTooltip /> */}
        </div>
      </>
    );
  }
}