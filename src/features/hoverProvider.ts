"use strict"
import {
  HoverProvider,
  MarkdownString,
  Position,
  TextDocument,
  CancellationToken,
  Hover,
  Range,
  workspace,
  languages
} from "vscode"
import * as cp from "child_process"
import { Utils } from "../utils/utils"

export default class PrologHoverProvider implements HoverProvider {
  // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
  private textToMarkedString(text: string): MarkdownString["value"] {
    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&")
  }

  public provideHover(doc: TextDocument, position: Position, token: CancellationToken): Hover {
    let wordRange: Range = doc.getWordRangeAtPosition(position)
    if (!wordRange) return
    let pred = Utils.getPredicateUnderCursor(doc, position)
    if (!pred || pred.arity <= 0) return

    let contents = new MarkdownString("", true)

    let pi = pred.pi.indexOf(":") > -1 ? pred.pi.split(":")[1] : pred.pi
    let modules: string[] = Utils.getPredModules(pi)
    if (modules.length === 0) {
      let desc = Utils.getPredDescriptions(pi)
      if (desc == "") contents.appendCodeblock(pi, "prolog")
      else contents.appendCodeblock(desc, "prolog")
    } else {
      if (modules.length > 0) {
        modules.forEach(module => {
          contents.appendText(module + ":" + pi + "\n")
          let desc = Utils.getPredDescriptions(module + ":" + pi)
          contents.appendCodeblock(desc, "prolog")
        })
      }
    }

    //return contents === [] ? null : new Hover(contents, wordRange);
    return new Hover(contents, wordRange)
  }
}
