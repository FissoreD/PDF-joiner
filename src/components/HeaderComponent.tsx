import React from "react";
import { MyBody } from "./BodyComponent";
import { PDF } from "./PDFComponent";
import { imgCreator } from "./Tools";

export class Header {
  body: MyBody;

  constructor(body: MyBody) {
    this.body = body;
  }

  async loadPDF() {
    var files = (document.getElementById('file-input') as HTMLInputElement).files;
    if (!files) { return; }
    for (const file of files) {
      let x = new PDF({ body: this.body });
      await x.openPdf(file)
    }
  }

  async mergeSelected() {
    let pdfSelected = this.body.state.pdfList.filter(e => e.getSelected());
    if (pdfSelected.length > 0) {
      let pdf = await pdfSelected.splice(0, 1)[0].duplicate();
      for (const e of pdfSelected) {
        await pdf.addAll(await e.duplicate());
      }
      return pdf;
    } else {
      alert("No PDF to merge");
    }
  }

  async saveSelected() {
    this.body.state.pdfList.forEach(async (e) => {
      if (e.getSelected())
        await e.download();
    })
  }

  render() {

    return (
      <div className="header">
        <label>
          <img data-tip="Open File" src="img/open.png" alt="open" className="logo"></img>
          {/* Ex. open file ext : accept=".jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*" */}
          <input type="file" id="file-input" className="file-input" multiple accept=".pdf" onChange={() => this.loadPDF()}></input>
        </label>
        {imgCreator({
          action: async () => this.body.setPdfList({ add: await this.mergeSelected() }),
          src: "img/merge.png"
        })}
        {/* <div onClick={async () => this.body.setPdfList({ add: new PDF({ body: this.body }) })}>Create Blank page</div> */}
        {imgCreator({ action: async () => this.saveSelected(), src: "img/saveAll.png" })}
      </div>
    );
  }
}
