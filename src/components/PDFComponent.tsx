import { PDFDocument } from "pdf-lib"
import { MyBody } from "./BodyComponent";
import download from "downloadjs";
import React from "react";

export class PDF {
  pdfDoc: Promise<PDFDocument>;
  pdfDataUri?: string;
  body: MyBody;
  fileName?: string;
  private selected: boolean;
  quantity: number;
  pdfDocOk?: PDFDocument;

  constructor(param: { body: MyBody, name?: string }) {
    this.body = param.body;
    this.fileName = param.name || "blank.pdf";
    this.pdfDoc = PDFDocument.create()
    this.pdfDoc.then(e => this.pdfDocOk = e);
    this.selected = false
    this.quantity = 1;
  }

  async addPage(a?: { pdf: PDF, pageNumber: number, pagePosition?: number }) {
    if (a && a.pdf) {
      const [pageCopied] = await (await this.pdfDoc).copyPages(await a.pdf.pdfDoc!, [a.pageNumber])
      if (a.pagePosition) (await this.pdfDoc).insertPage(a.pagePosition, pageCopied)
      else (await this.pdfDoc).addPage(pageCopied)
    }
    else (await this.pdfDoc).addPage();
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

  async updateFrameConetent() {
    (await this.pdfDoc!).saveAsBase64({ dataUri: true }).then(
      async e => {
        this.pdfDocOk = await this.pdfDoc!

        // PdfDataUri is to put inside the src of the frame
        this.pdfDataUri = e;
        this.body.setPdfList({ add: this });
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
    let pdfList = this.body.state.pdfList;
    this.quantity = Math.max(1, this.quantity + val)
    console.log(this.quantity);

    this.body.setState({ pdfList })
  }

  getQuantity() {
    return this.quantity;
  }

  async duplicate(pdf?: PDF) {
    let pdfCopy;
    if (pdf) {
      pdfCopy = pdf;
    } else {
      let name = this.quantity > 1 ? this.fileNameRoot() + "-dupl.pdf" : this.fileName
      pdfCopy = new PDF({ body: this.body, name });
    }

    for (let i = 0; i < this.quantity; i++) {
      await pdfCopy.addAll(this)
    }
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

  render() {
    return (
      <div className="fPDF">
        <div className="fOption">
          <img className="logo" alt="blank" onClick={async () => this.body.setPdfList({ add: (await this.intervallWhitePage()) })} src="img/blank-page.jpg"></img>
          <img className="logo" alt="download" onClick={() => this.download()} src="img/download.webp"></img>
          {this.number()}
          <img className="logo" alt="duplicate" onClick={async () => this.body.setPdfList({ add: (await this.duplicate()) })} src="img/duplicate.png"></img>
          <input type="checkbox"
            onClick={(evt) => this.isSelected((evt.target as HTMLInputElement).checked)}>
          </input>
          <img className="logo" alt="quit" onClick={() => this.body.setPdfList({ remove: this })} src="img/x.png"></img>
          <img className="logo" alt="view" onClick={async () => this.viewer()} src="img/glasses.png"></img>
          <img className="logo" alt="save" onClick={async () => this.download()} src="img/save.png"></img>
        </div>
        <div className="fName">{this.fileName} - #(Page) : {this.getPagesNumber()}</div>
      </div>
    );
  }

  // dragEvent(event: Event) {

  //     // (1) prepare to moving: make absolute and on top by z-index
  //     ball.style.position = 'absolute';
  //     ball.style.zIndex = 1000;

  //     // move it out of any current parents directly into body
  //     // to make it positioned relative to the body
  //     document.body.append(ball);

  //     // centers the ball at (pageX, pageY) coordinates
  //     function moveAt(pageX, pageY) {
  //       ball.style.left = pageX - ball.offsetWidth / 2 + 'px';
  //       ball.style.top = pageY - ball.offsetHeight / 2 + 'px';
  //     }

  //     // move our absolutely positioned ball under the pointer
  //     moveAt(event.pageX, event.pageY);

  //     function onMouseMove(event) {
  //       moveAt(event.pageX, event.pageY);
  //     }

  //     // (2) move the ball on mousemove
  //     document.addEventListener('mousemove', onMouseMove);

  //     // (3) drop the ball, remove unneeded handlers
  //     ball.onmouseup = function () {
  //       document.removeEventListener('mousemove', onMouseMove);
  //       ball.onmouseup = null;
  //     };
  // }
}