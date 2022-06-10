import React from "react";
import { Component, ReactNode } from "react";
import { Header } from "./HeaderComponent";
import { PDF } from "./PDFComponent";
import { DragDropContext, Droppable, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import ReactTooltip from "react-tooltip";

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
    const pdfList = this.state.pdfList;


    let handleOnDragEnd = (result: DropResult, provided: ResponderProvided) => {
      if (!result.destination) return;

      const [reorderedItem] = pdfList.splice(result.source.index, 1);
      pdfList.splice(result.destination.index, 0, reorderedItem);
      this.setState({ pdfList });
    }

    return (
      <>
        {this.state.header.render()}
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="pdfList">
            {(provided) => (
              <div className="allPDFContainer" {...provided.droppableProps} ref={provided.innerRef}>
                {this.state.pdfList.map((e, pos) => e.render(pos))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <ReactTooltip />
      </>
    );
  }
}