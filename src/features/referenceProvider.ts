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
  workspace,
  Uri
} from "vscode";
import * as fs from "fs";
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
    var regex= "\\((.|\\s)*?\\)"
    const regexp = new RegExp(pred.functor+regex,"gm");
    const regexpModule = /^\s*:-\s*use_module\(([a-z][a-zA-Z0-9_\/]*)\s*(,|\)\s*\.)/gm;
    const arrayModule = [...docContent.matchAll(regexpModule)]
    const prolog = doc.fileName.split(".")[1]
    const array = [...docContent.matchAll(regexp)];
    var locations =array.map((elem)=>new Location(Uri.file(doc.fileName),doc.positionAt(elem.index)));
    for(let i = 0 ; i < arrayModule.length;i++){
        var text=fs.readFileSync(workspace.workspaceFolders[0].uri.fsPath+"/"+arrayModule[i][1]+"."+prolog, 'utf8');
        const array = [...text.matchAll(regexp)];
        locations = locations.concat(array.map((elem)=>new Location(Uri.file(workspace.workspaceFolders[0].uri.fsPath+"/"+arrayModule[i][1]+"."+prolog),findLineColForByte(text,elem.index))));
    }
    return locations
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
