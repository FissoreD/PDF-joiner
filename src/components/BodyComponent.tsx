import React from "react";
import { Component, ReactNode } from "react";
import { Header } from "./HeaderComponent";
import { PDF } from "./PDFComponent";

export class MyBody extends Component<{}, { pdfList: PDF[], header: Header }> {

  constructor(props: string) {
    super(props);
    this.state = {
      pdfList: [],
      header: new Header(this),
    }
  }

  async setPdfList(inp: { add?: PDF, remove?: PDF }) {
    let pdfList = this.state.pdfList
    if (inp.add)
      this.setState({
        pdfList: pdfList.concat(inp.add),
      })
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
    return (
      <>
        {this.state.header.render()}
        {this.state.pdfList.map((e, pos) =>
          <div key={pos} className="fileContainer">
            {e.render()}
            {/* <iframe title={pos + ""} src={e.pdfDataUri}></iframe> */}
          </div>
        )}
      </>
    );
  }
}