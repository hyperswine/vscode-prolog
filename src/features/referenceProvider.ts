import { PrologRefactor } from "./prologRefactor";
import { Utils } from "../utils/utils";
import {
  ReferenceProvider,
  TextDocument,
  Position,
  ReferenceContext,
  CancellationToken,
  Location,
  window,
  Uri
} from "vscode";
import { spawn } from "process-promises";

export class PrologReferenceProvider implements ReferenceProvider {
  constructor() {}
  public provideReferences(
    doc: TextDocument,
    position: Position,
    context: ReferenceContext,
    token: CancellationToken
  ): Location[] {
    let docContent = doc.getText(); 
    let pred = Utils.getPredicateUnderCursor(doc, position);
    console.log(pred)
    var regex= "\\("
    for(let i =0 ; i<pred.arity ;i++){
      regex = regex+"\\s*[A-Z][a-zA-Z0-9_]*\\s*";
      if (i != pred.arity - 1){
        regex = regex +",";
      }
    }
    regex = regex + "\\)"
    const regexp = new RegExp(pred.functor+regex,"gm");
    const array = [...docContent.matchAll(regexp)];
    return array.map((elem)=>new Location(Uri.file(doc.fileName),findLineColForByte(docContent,elem.index))); 
  }
}

function findLineColForByte(doc, index) {
  const lines = doc.split("\n");
  let totalLength = 0
  let lineStartPos = 0
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    totalLength += lines[lineNo].length + 1 // Because we removed the '\n' during split.
    if (index < totalLength) {
      const colNo = index - lineStartPos
      return new Position(lineNo, colNo)
    }
    lineStartPos = totalLength
  }
}
