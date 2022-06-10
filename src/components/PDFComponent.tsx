import download from "downloadjs";
import { PDFDocument } from "pdf-lib";
import React, { ChangeEvent } from "react";
import { Draggable } from "react-beautiful-dnd";
import ReactTooltip from "react-tooltip";
import { MyBody } from "./BodyComponent";
import { imgCreator, loadingSpinner } from "./Tools";

export class PDF {
  static id = 0;
  pdfDoc: Promise<PDFDocument>;
  pdfDataUri?: string;
  body: MyBody;
  fileName?: string;
  private selected: boolean;
  quantity: number;
  pdfDocOk?: PDFDocument;
  id: number;
  isLoading = true;

  constructor(param: { body: MyBody, name?: string }) {
    this.body = param.body;
    this.fileName = param.name || "blank.pdf";
    this.pdfDoc = PDFDocument.create()
    this.pdfDoc.then(e => this.pdfDocOk = e);
    this.selected = false
    this.quantity = 1;
    this.id = ++PDF.id;
    this.body.setPdfList({ add: this });
  }

  async addPage(a?: { pdf: PDF, pageNumber: number, pagePosition?: number }) {
    if (a && a.pdf) {
      const [pageCopied] = await (await this.pdfDoc).copyPages(await a.pdf.pdfDoc!, [a.pageNumber])
      if (a.pagePosition) (await this.pdfDoc).insertPage(a.pagePosition, pageCopied)
      else (await this.pdfDoc).addPage(pageCopied)
    } else (await this.pdfDoc).addPage();
  }

  async addAll(pdf: PDF) {
    for (let pageNumber = 0; pageNumber < (await pdf.pdfDoc!).getPages().length; pageNumber++) {
      await this.addPage({ pdf, pageNumber });
    }
  }

  async download() {
    let bites = await (await this.pdfDoc).save()
    download(bites, this.fileName, "application/pdf");
  }

  async intervallWhitePage() {
    let pdf = new PDF({ body: this.body, name: this.fileNameRoot() + "-wp.pdf" });
    let pageNumber = (await this.pdfDoc).getPages().length
    for (let i = 0; i < pageNumber - 1; i++) {
      await pdf.addPage({ pdf: this, pageNumber: i })
      await pdf.addPage()
    }
    await pdf.addPage({ pdf: this, pageNumber: pageNumber - 1 })
    await pdf.updateFrameConetent()
    return pdf;
  }

  async openPdf(f: File) {
    function getBuffer(fileData: Blob) {
      return function (resolve: any) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(fileData);
        reader.onload = function () {
          var arrayBuffer = reader.result as ArrayBuffer
          var bytes = new Uint8Array(arrayBuffer);
          resolve(bytes);
        }
      }
    }
    this.fileName = f.name;
    var fileData = new Blob([f]);
    var promise = new Promise(getBuffer(fileData));
    promise.then(async (data) => {
      this.pdfDoc = PDFDocument.load(data as string, { ignoreEncryption: true })
      await (await this.pdfDoc).save();
      await this.updateFrameConetent();
    }).catch(function (err) {
      console.log('Error in PDF opening ! ', err);
    });
  }

  getPagesNumber() {
    return this.pdfDocOk!.getPages().length
  }

  fileNameRoot() {
    return this.fileName?.substring(0, this.fileName.length - 4)
  }

  isSelected(b: boolean) {
    this.selected = b;
  }

  getSelected() {
    return this.selected
  }

  modifyQuantity(val: number) {
    // TODO : Use ref instead to update pdfList
    this.quantity = Math.max(1, this.quantity + val)
    this.body.forceUpdate()
  }

  getQuantity() {
    return this.quantity;
  }

  async duplicate(a?: { pdf?: PDF, quantity?: number }) {
    let pdfCopy;
    if (a?.pdf) {
      pdfCopy = a.pdf;
    } else {
      let name = this.quantity > 1 ? this.fileNameRoot() + "-dupl.pdf" : this.fileName
      pdfCopy = new PDF({ body: this.body, name });
    }
    for (let i = 0; i < (a?.quantity || this.quantity); i++) {
      await pdfCopy.addAll(this)
    }
    await pdfCopy.updateFrameConetent()
    return pdfCopy
  }

  async viewer() {
    let array = await (await this.pdfDoc!).save()
    const arr = new Uint8Array(array);
    const blob = new Blob([arr], { type: 'application/pdf' });
    window.open(URL.createObjectURL(blob), "_blank")
  }

  number() {
    return (
      <div className="number">
        <img className="logo" alt="minus" onClick={() => this.modifyQuantity(-1)} src="img/minus.png"></img>
        <span>{this.quantity}</span>
        <img className="logo" alt="plus" onClick={() => this.modifyQuantity(1)} src="img/plus.png"></img>
      </div>
    );
  }

  async splitter(str: string): Promise<PDF | undefined> {
    let commandSplit = str.split(',')
    let pdf = new PDF({ body: this.body, name: this.fileNameRoot() + "-split.pdf" });
    try {
      for (const commaSplit of commandSplit) {
        let split = commaSplit.split("-").map(dashSplit => {
          if (dashSplit === "") return -1;
          let int = Number.parseInt(dashSplit)
          if (isNaN(int)) {
            throw new Error(`${commaSplit} is invalid : it should be on the form : INT-INT or INT`);
          }
          return int - 1;
        })
        if (split[0] > this.getPagesNumber()) break;
        if (split.length === 1) {
          await pdf.addPage({ pdf: this, pageNumber: split[0] })
        } else {
          if (split[1] >= this.getPagesNumber()) split[1] = this.getPagesNumber() - 1;
          if (split[0] === -1) split[0] = 0;
          if (split[1] === -1) split[1] = this.getPagesNumber() - 1;
          if (split[0] > split[1]) break;
          for (let index = split[0]; index <= split[1]; index++) {
            await pdf.addPage({ pdf: this, pageNumber: index })
          }
        }
      }
      return pdf;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Invalid Integer")) {
        alert(e.message)
      }
    }
  }

  splitterDiv() {
    let clearInput = (evt: React.KeyboardEvent<HTMLInputElement>) => {
      let val = evt.currentTarget.value;
      let pageNumber = this.getPagesNumber()
      let semicolon = val.split(";").filter(e => e !== "")
      let comma = semicolon.map(e => e.split(",").filter(e => e !== ""))
      let dash = comma.map(e => e.map(e => {
        let res = e.split("-");
        if (parseInt(res[0]) >= pageNumber) return "";
        if (res.length === 2) {
          if (res[0] === "") res[0] = "1"
          if (res[1] === "" || parseInt(res[1]) >= pageNumber) res[1] = pageNumber + "";
          return `${res[0]}-${res[1]}`
        }
        return res[0]
      }).filter(e => e !== "").join(",")).join(";")
      return dash
    }

    let splitterEvt = async (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter" || evt.key === "NumpadEnter") {
        evt.currentTarget.value = clearInput(evt);
        let splitCommaDot = (evt.target as HTMLInputElement).value.split(";")
        for (const iterator of splitCommaDot) {
          (await this.splitter(iterator))?.updateFrameConetent()
        }
      }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      let val = e.currentTarget.value;
      let regex = /^(([0-9]*(-[0-9]*)?)[,;])*([0-9]*(-[0-9]*)?)$/g;
      if (val.match(regex) === null) {
        e.currentTarget.value = val.substring(0, val.length - 1);
      }
    };

    return (
      <label htmlFor="pdfSplitter">
        <span data-tip="Split PDF">Splitter</span>
        <input type="text" id="" defaultValue={"1-" + this.getPagesNumber()}
          onKeyDown={splitterEvt} onChange={handleChange} />
      </label>
    );
  }

  async updateFrameConetent() {
    this.isLoading = false;
    (await this.pdfDoc!).saveAsBase64({ dataUri: true }).then(
      async e => {
        this.pdfDocOk = await this.pdfDoc!
        this.pdfDataUri = e;
        this.body.forceUpdate()
      });
  }

  render(index: number) {
    console.log("HERE");

    return (
      <Draggable key={this.id} draggableId={this.id + ""} index={index}>
        {(provided) => (
          <div className="movable-item fileContainer pdfList" key={this.id}
            ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
            {this.isLoading ? loadingSpinner() :
              <>
                <div className="fOption">
                  {imgCreator({
                    action: async () => await this.intervallWhitePage(),
                    src: "img/blank-page.jpg",
                    tooltip: "Interval with blank pages"
                  })}
                  {imgCreator({
                    action: () => this.viewer(),
                    src: "img/glasses.png",
                    tooltip: "Open in new page"
                  })}
                  {imgCreator({
                    action: () => this.download(),
                    src: "img/save.png",
                    tooltip: "Save this pdf"
                  })}
                  {imgCreator({
                    action: () => this.body.setPdfList({ remove: this }),
                    src: "img/x.png",
                    tooltip: "Remove this pdf"
                  })}
                  {imgCreator({
                    action: async () => await this.duplicate(),
                    src: "img/duplicate.png",
                    tooltip: "Duplicate document"
                  })}
                  <input type="checkbox" data-tip="Select for merge"
                    onClick={(evt) => this.isSelected((evt.target as HTMLInputElement).checked)}>
                  </input>
                  {this.number()}
                  {this.splitterDiv()}
                </div>
                <div className="fName">{this.fileName} - #(Page): {this.getPagesNumber()}  </div>
                <ReactTooltip />
              </>
            }
          </div>)
        }
      </Draggable>
    );
  }
}