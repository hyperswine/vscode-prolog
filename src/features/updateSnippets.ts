import { Variable } from "@vscode/debugadapter";
import {
  TextDocument,
  window,
  Disposable,
  Position,
  CancellationToken,
  CompletionContext,
  CompletionItem,
  SnippetString,
  MarkdownString,
  Uri,
  workspace,
  CompletionItemKind,

} from "vscode";
import * as fs from "fs";
import { Utils} from "../utils/utils";




export   class SnippetUpdater {
  public updateSnippet() {

      // Create as needed 

      // Get the current text editor 
      let editor = window.activeTextEditor; 
      if (!editor) { 
          return; 
      } 

      let doc = editor.document; 
      // Only update status if an prolog file 
      if (doc.languageId === "prolog") { 
        var predicats = this._getPredicat(doc); 
        var already = [];
        Object.keys(Utils.snippets).forEach((elem)=>{
          if(elem.includes(":")){
            if(elem.includes(":-")){
              already.push(elem.replace(":- ",""));
            }else{
              already.push(elem.split(":")[1]);
            }
          }else{
            already.push(elem);
          }
        });
        predicats.forEach((elem)=>{
          let num = elem[1].split(",").length
          if(!already.includes(elem[0]+"/"+num.toString())){
            Utils.snippets[elem[0]+"/"+num.toString()] = {prefix : elem[0], body:[""],
            description:elem[0].toString()+"("+elem[1].toString()+")\ncustom predicate\n\n"
          };
            Utils.newsnippets.push(elem);
          }
        });
        Utils.genPredicateModules(Utils.CONTEXT);
      }
  } 

  public _getPredicat(doc: TextDocument)  { 

      let docContent = doc.getText(); 
      const regexp = /^\s*([a-z][a-zA-Z0-9_]*)\(([a-zA-Z0-9_\-, ]*)\)(?=.*:-.*)/gm;
      const regexpModule = /^\s*:-\s*use_module\(([a-z][a-zA-Z0-9_\/]*)\s*\)\s*\./gm;
      const arrayModule = [...docContent.matchAll(regexpModule)]
      const prolog = doc.fileName.split(".")[1]
      var predicats = [];
      for(let i = 0 ; i < arrayModule.length;i++){
          var text=fs.readFileSync(workspace.workspaceFolders[0].uri.fsPath+"/"+arrayModule[i][1]+"."+prolog, 'utf8');
          const array2 = [...text.matchAll(regexp)]
          predicats = predicats.concat(array2.map(function(value) { return [value[1],value[2]]; }));
      }
      const array = [...docContent.matchAll(regexp)]
      predicats = predicats.concat(array.map(function(value) { return [value[1],value[2]]; }));
      predicats = predicats.filter(function (predicat) {return predicat[0]!= "test"});
      return predicats; 
  } 
  dispose() {
  }
}

export class SnippetUpdaterController {

  private snippetUpdater: SnippetUpdater;
  private _disposable: Disposable;

  constructor(snippetUpdater: SnippetUpdater) {
      this.snippetUpdater = snippetUpdater;
      this.snippetUpdater.updateSnippet();

      // subscribe to selection change and editor activation events
      let subscriptions: Disposable[] = [];
      workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
      window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

      // update the counter for the current file
      this.snippetUpdater.updateSnippet();

      // create a combined disposable from both event subscriptions
      this._disposable = Disposable.from(...subscriptions);
  }

  dispose() {
      this._disposable.dispose();
  }

  private _onEvent() {
      this.snippetUpdater.updateSnippet();
  }
}


export  class PrologCompletionProvider {
  public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
    var snippetCompletion = [];
    Utils.newsnippets.forEach((elem)=>{
      const params= elem[1].split(",");
      const completionItem = new CompletionItem(elem[0]+"/"+params.length,CompletionItemKind.Function);
      let str = elem[0].toString()+"(";
      let str2 =""
      for(let i =0 ; i<params.length ;i++){
        str = str +"${"+(i+2).toString()+":"+params[i]+"}";
        str2 = str2 + '<span style="color:#ff7878;">'+params[i]+'</span>'
        if (i != params.length - 1){
          str = str +",";
          str2 = str2 +",";
        }
      }
      str = str+")$0";
      
      completionItem.insertText = new SnippetString(str);
      //const docs: any = new MarkdownString( '<span style="color:#de190b;">yes</span>'+elem[0].toString()+"("+elem[1].toString()+")\n custom predicate\n\n");
      const docs: any = new MarkdownString();
      docs.supportHtml = true;
      docs.appendMarkdown('<span style="color:#8da9fc;">'+elem[0].toString()+'</span>('+str2+')</br>Custom predicate');
      completionItem.documentation = docs;
      completionItem.detail = elem[0]+"/"+params.length;
      snippetCompletion.push(completionItem);
    });
    /*snippetCompletion.insertText = new SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
    const docs: any = new MarkdownString("Inserts a snippet that lets you select [link](x.ts).");
    snippetCompletion.documentation = docs;
    docs.baseUri = Uri.parse('http://example.com/a/b/c/');*/
    return snippetCompletion ;
  }
}