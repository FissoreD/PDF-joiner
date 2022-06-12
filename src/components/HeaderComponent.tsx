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
    let pdfSelected = this.body.state.pdfList.filter(e => e.getChecked());
    if (pdfSelected.length > 0) {
      let pdf = new PDF({ body: this.body, name: "merge.pdf" });
      for (const e of pdfSelected) {
        await pdf.addAll(await e.duplicate({}, false));
        e.setChecked(false, false)
      }
      await pdf.updateFrameConetent()
      return pdf;
    } else {
      alert("No PDF to merge");
    }
  }

  async saveSelected() {
    this.body.state.pdfList.forEach(async (e) => {
      if (e.getChecked()) {
        await e.download();
        e.setChecked(false, false)
      }
    })
    this.body.forceUpdate()
  }

  async creteBlankPage() {
    let pdf = new PDF({ body: this.body })
    await pdf.addPage()
    pdf.updateFrameConetent()
  }

  render() {
    return (
      <div className="header">
        <label>
          <img data-tip="Open File" src="img/open.png" alt="open" className="logo"></img>
          {/* Ex. open file ext : accept=".jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*" */}
          <input type="file" id="file-input" className="file-input" multiple accept=".pdf"
            onChange={() => this.loadPDF()} onClick={(event) => {
              event.currentTarget.value = ""
            }}></input>
        </label>
        {imgCreator({
          action: async () => await this.mergeSelected(),
          src: "img/merge.png",
          tooltip: "Merge Selected"
        })}
        {imgCreator({
          action: async () => this.creteBlankPage(), src: "img/blankPage.png",
          tooltip: "Create Blank PDF"
        })}
        {imgCreator({
          action: async () => this.saveSelected(), src: "img/saveAll.png",
          tooltip: "Save Selected"
        })}
        {imgCreator({
          action: async () => this.body.setState({ pdfList: [] }), src: "img/forbidden.png",
          tooltip: "Close All"
        })}
      </div>
    );
  }
}
