import download from "downloadjs";
import { degrees, PDFDocument } from "pdf-lib";
import React, { ChangeEvent } from "react";
import ReactSwitch from "react-switch";
import { MyBody } from "./BodyComponent";
import { imgCreator, loadingSpinner } from "./Tools";

export class PDF {
  static id = 0;
  pdfDoc: Promise<PDFDocument>;
  pdfDataUri?: string;
  body: MyBody;
  fileName?: string;
  private checked: boolean;
  quantity: number;
  pdfDocOk?: PDFDocument;
  id: number;
  isLoading = true;
  splitterString: string;

  static readonly a4Size = {
    width: 595.28,
    height: 841.89,
    ratio: 595.28 / 841.89
  }

  constructor(param: { body: MyBody, name?: string, toAdd?: boolean }) {
    this.body = param.body;
    this.fileName = param.name || "blank.pdf";
    this.pdfDoc = PDFDocument.create()
    this.pdfDoc.then(e => this.pdfDocOk = e);
    this.checked = true
    this.quantity = 1;
    this.id = ++PDF.id;
    if (param.toAdd || param.toAdd === undefined)
      this.body.setPdfList({ add: this });
    this.splitterString = ""
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
      (await this.pdfDoc).getPages().forEach(page => {
        let { width, height } = page.getSize();

        let [widthR, heightR] =
          [PDF.a4Size.width / Math.min(width, height),
          PDF.a4Size.height / Math.max(width, height)]
        if (width > height) {
          page.setRotation(degrees(90));
          page.setSize(PDF.a4Size.height, PDF.a4Size.width)
          page.scaleContent(widthR, widthR)
        } else {
          page.setSize(PDF.a4Size.width, PDF.a4Size.height)
          page.scaleContent(heightR, heightR)
        }
      });
    }).catch(function (err) {
      console.error('Error in PDF opening ! ', err);
      alert('Error in PDF opening !');
    });
  }

  getPagesNumber() {
    return this.pdfDocOk!.getPageCount()
  }

  fileNameRoot() {
    return this.fileName?.substring(0, this.fileName.length - 4)
  }

  setChecked(b: boolean, update = true) {
    this.checked = b;
    if (update) this.body.forceUpdate()
  }

  getChecked() {
    return this.checked
  }

  getQuantity() {
    return this.quantity;
  }

  async duplicate(a?: { pdf?: PDF, quantity?: number }, toAdd?: boolean) {
    let pdfCopy;
    if (a?.pdf) {
      pdfCopy = a.pdf;
    } else {
      let name = this.quantity > 0 ? this.fileNameRoot() + "-dupl.pdf" : this.fileName
      pdfCopy = new PDF({ body: this.body, name, toAdd });
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

  duplicateDiv() {
    const duplicateEvt = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key.includes("Enter")) this.duplicate()
    }

    const duplicateSpell = (e: ChangeEvent<HTMLInputElement>) => {
      let val = e.currentTarget.value;
      let regex = /^[0-9]*$/g;
      if (val.match(regex) === null) {
        e.currentTarget.value = val.substring(0, val.length - 1);
      } else {
        let int = parseInt(val)
        if (val === "" || int === 0) return
        this.quantity = int;
      }
    }
    let inp =
      <input type="text" id="" defaultValue={"1"}
        onKeyDown={duplicateEvt} onChange={duplicateSpell} />

    return (
      <label className="txtInp">
        <span data-tip="Split PDF">Duplicate</span>
        {inp}
        {imgCreator({ src: "img/ok.png", action: () => { this.duplicate() }, isSendIcon: true })}
      </label>
    );
  }

  async splitter(): Promise<PDF[] | undefined> {
    if (this.splitterString.length === 0) return
    let semicolonSplit = this.splitterString.split(";")
    let pdfs: PDF[] = []
    for (const str of semicolonSplit) {
      let comma = str.split(',')
      if (comma.length === 0) continue
      let pdf = new PDF({ body: this.body, name: this.fileNameRoot() + "-split.pdf" });
      try {
        for (const commaSplit of comma) {
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
        pdfs.push(pdf)
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("Invalid Integer")) {
          alert(e.message)
        }
      }
    }
    pdfs.forEach(async e => await e.updateFrameConetent())
    return pdfs;
  }

  splitterDiv() {
    let clearInput = (evt: React.KeyboardEvent<HTMLInputElement>) => {
      let val = evt.currentTarget.value;
      let pageNumber = this.getPagesNumber()
      let semicolon = val.split(";").filter(e => e !== "")
      let comma = semicolon.map(e => e.split(",").filter(e => e !== ""))
      let dash = comma.map(e => e.map(e => {
        let res = e.split("-");
        if (parseInt(res[0]) > pageNumber) return "";
        if (res.length === 2) {
          if (res[0] === "") res[0] = "1"
          if (res[1] === "" || parseInt(res[1]) >= pageNumber) res[1] = pageNumber + "";
          return `${res[0]}-${res[1]}`
        }
        return res[0]
      }).filter(e => e !== "").join(",")).join(";")
      this.splitterString = dash;
      return dash
    }

    let splitterEvt = async (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter" || evt.key === "NumpadEnter") {
        evt.currentTarget.value = clearInput(evt);
        this.splitter()
      }
    }

    const spellChecker = (e: ChangeEvent<HTMLInputElement>) => {
      let val = e.currentTarget.value;
      let regex = /^(([0-9]*(-[0-9]*)?)[,;])*([0-9]*(-[0-9]*)?)$/g;
      if (val.match(regex) === null) {
        e.currentTarget.value = val.substring(0, val.length - 1);
      } else {
        this.splitterString = val
      }
      this.body.forceUpdate()
    }

    return (
      <label className="txtInp">
        <span data-tip="Split PDF">Splitter</span>
        <input type="text" id="" value={this.splitterString}
          onKeyDown={splitterEvt} onChange={spellChecker} />
        {imgCreator({ src: "img/ok.png", action: () => { this.splitter() }, isSendIcon: true })}
      </label>
    );
  }

  async updateFrameConetent() {
    this.isLoading = false;
    (await this.pdfDoc!).saveAsBase64({ dataUri: true }).then(
      async e => {
        this.pdfDocOk = await this.pdfDoc!
        this.pdfDataUri = e;
        this.splitterString = `1-${this.getPagesNumber()}`;
        this.body.forceUpdate()
      })
  }

  render(_index?: number) {
    return <div className={"fileContainer " + (this.isLoading ? "loadingBar" : "")}>
      {
        this.isLoading ? loadingSpinner() :
          <>
            <div className="fOption">
              {imgCreator({
                action: async () => await this.intervallWhitePage(),
                src: "img/interval.png",
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
            </div>
            <label className="txtInp">
              <span>Checked</span>
              <ReactSwitch onChange={(evt) => this.setChecked(evt)} checked={this.checked} />
            </label>
            {this.duplicateDiv()}
            {this.splitterDiv()}
            <div className="fName">{this.fileName} <br /> #(Page): {this.getPagesNumber()}  </div>
          </>
      }
    </div>
  }
}