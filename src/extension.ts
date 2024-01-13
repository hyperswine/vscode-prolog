"use strict"

import {
  commands,
  DocumentFilter,
  ExtensionContext,
  window,
  languages,
  workspace
} from "vscode"
import * as path from "path"
import PrologTerminal from "./features/prologTerminal"
import { loadEditHelpers } from "./features/editHelpers"
import { Utils } from "./utils/utils"
import PrologHoverProvider from "./features/hoverProvider"
import PrologDocumentHighlightProvider from "./features/documentHighlightProvider"
import PrologDocumentFormatter from "./features/formattingEditProvider"
import { SnippetUpdater, SnippetUpdaterController, PrologCompletionProvider } from "./features/updateSnippets"
import { PrologFormatter } from "./features/prologFormatter"
import { PrologDefinitionProvider } from "./features/definitionProvider"
import { PrologReferenceProvider } from "./features/referenceProvider"
import PrologLinter from "./features/prologLinter"
import { PrologRefactor } from "./features/prologRefactor"
import { ensureSymlink, remove } from "fs-extra-plus"
import jsesc from "jsesc"
import * as fs from "fs"

async function initForDialect(context: ExtensionContext) {
  // const section = workspace.getConfiguration("prolog")
  // const dialect = section.get<string>("dialect")
  // const exec = section.get<string>("executablePath", "swipl")
  // Utils.LINTERTRIGGER = section.get<string>("linter.run")
  // Utils.FORMATENABLED = section.get<boolean>("format.enabled")
  // Utils.RUNTIMEPATH = jsesc(exec)
  // const exPath = jsesc(context.extensionPath)
  // Utils.EXPATH = exPath
  // const diaFile = path.resolve(`${exPath}/.vscode`) + "/dialect.json"
  // const lastDialect = JSON.parse(fs.readFileSync(diaFile).toString()).dialect
  // if (lastDialect === dialect) return

  // symlinks here
  // const symLinks = [
  //   {
  //     path: path.resolve(`${exPath}/syntaxes`),
  //     srcFile: `prolog.swi.tmLanguage.json`,
  //     targetFile: "prolog.tmLanguage.json"
  //   },
  //   {
  //     path: path.resolve(`${exPath}/snippets`),
  //     srcFile: `prolog.json`,
  //     targetFile: "prolog.json"
  //   }
  // ]

  // await Promise.all(
  //   symLinks.map(async link => {
  //     await remove(path.resolve(`${link.path}/${link.targetFile}`))
  //     try {
  //       return await ensureSymlink(
  //         path.resolve(`${link.path}/${link.srcFile}`),
  //         path.resolve(`${link.path}/${link.targetFile}`)
  //       )
  //     } catch (err) {
  //       window.showErrorMessage("SWI Prolog failed in initialization... Are you sure you have the right privileges?")
  //       throw (err)
  //     }
  //   })
  // )

  // fs.writeFileSync(diaFile, JSON.stringify({ dialect: dialect }))
}

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
  console.log('SWI Prolog is now active!')
  await initForDialect(context)

  const PROLOG_MODE: DocumentFilter = { language: "prolog", scheme: "file" }

  Utils.init(context)

  loadEditHelpers(context.subscriptions)

  let myCommands = [
    {
      command: "prolog.load.document",
      callback: () => {
        PrologTerminal.loadDocument()
      }
    },
    {
      command: "prolog.query.goal",
      callback: () => {
        PrologTerminal.queryGoalUnderCursor()
      }
    },
    {
      command: "prolog.refactorPredicate",
      callback: () => {
        new PrologRefactor().refactorPredUnderCursor()
      }
    }
  ]

  let linter: PrologLinter
  if (Utils.LINTERTRIGGER !== "never") {
    linter = new PrologLinter(context)
    linter.activate()
    myCommands = myCommands.concat([
      {
        command: "prolog.linter.nextErrLine",
        callback: () => {
          linter.nextErrLine()
        }
      },
      {
        command: "prolog.linter.prevErrLine",
        callback: () => {
          linter.prevErrLine()
        }
      }
    ])
  }

  myCommands.map(command => {
    context.subscriptions.push(
      commands.registerCommand(command.command, command.callback)
    )
  })

  if (Utils.LINTERTRIGGER !== "never") {
    context.subscriptions.push(
      languages.registerCodeActionsProvider(PROLOG_MODE, linter)
    )
  }
  context.subscriptions.push(
    languages.registerHoverProvider(PROLOG_MODE, new PrologHoverProvider())
  )
  context.subscriptions.push(
    languages.registerDocumentHighlightProvider(
      PROLOG_MODE,
      new PrologDocumentHighlightProvider()
    )
  )
  if (process.platform !== "win32" && Utils.FORMATENABLED) {
    context.subscriptions.push(
      languages.registerDocumentRangeFormattingEditProvider(
        PROLOG_MODE,
        new PrologDocumentFormatter()
      )
    )
    context.subscriptions.push(
      languages.registerOnTypeFormattingEditProvider(
        PROLOG_MODE,
        new PrologDocumentFormatter(),
        ".",
        "\n"
      )
    )
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider(
        PROLOG_MODE,
        new PrologDocumentFormatter()
      )
    )
  }
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      PROLOG_MODE,
      new PrologDefinitionProvider()
    )
  )
  context.subscriptions.push(
    languages.registerReferenceProvider(
      PROLOG_MODE,
      new PrologReferenceProvider()
    )
  )
  context.subscriptions.push(PrologTerminal.init())
  // Add to a list of disposables which are disposed when this extension is deactivated.
  let snippetUpdater = new SnippetUpdater()
  context.subscriptions.push(new SnippetUpdaterController(snippetUpdater))
  context.subscriptions.push(snippetUpdater)

  context.subscriptions.push(
    languages.registerCompletionItemProvider(PROLOG_MODE, new PrologCompletionProvider())
  )

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(PROLOG_MODE, new PrologFormatter())
  )
}

// this method is called when your extension is deactivated
export function deactivate() { }
