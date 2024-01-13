import {
  CancellationToken,
  DefinitionProvider,
  Location,
  Position,
  TextDocument,
  Uri,
} from "vscode"
import * as cp from "child_process"
import { Utils } from "../utils/utils"

export class PrologDefinitionProvider implements DefinitionProvider {
  public provideDefinition(
    doc: TextDocument,
    position: Position,
    token: CancellationToken
  ): Location | Thenable<Location> {
    let location: Location = null
    let pred = Utils.getPredicateUnderCursor(doc, position)
    if (!pred) return null

    let exec = Utils.RUNTIMEPATH
    let args: string[] = [],
      prologCode: string,
      result: string[],
      predToFind: string,
      runOptions: cp.SpawnSyncOptions
    const fileLineRe = /File:(.+);Line:(\d+)/

    var pred_void = pred.functor + "("
    for (let i = 0; i < pred.arity; i++) {
      pred_void = pred_void + "_"
      if (i < pred.arity - 1) {
        pred_void = pred_void + ","
      }
    }
    pred_void = pred_void + ")"
    args = ["-q", doc.fileName]
    prologCode = `
        source_location:-
          predicate_property(${pred_void}, file(File)),
          predicate_property(${pred_void}, line_count(Line)),
          format("File:~s;Line:~d~n", [File, Line]).
          `
    if (doc.isDirty) {
      doc.save().then(_ => {
        result = Utils.execPrologSync(
          args,
          prologCode,
          "source_location",
          "",
          fileLineRe
        )
      })
    } else {
      result = Utils.execPrologSync(
        args,
        prologCode,
        "source_location",
        "",
        fileLineRe
      )
    }

    if (result) {
      let fileName: string = result[1]
      let lineNum: number = parseInt(result[2])
      location = new Location(Uri.file(fileName), new Position(lineNum - 1, 0))
    }

    location
  }
}
